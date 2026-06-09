import { ChordSheet, PagedResult } from "../models/interfaces";

/**
 * Cache of ChordSheet objects. Used for offline search.
 */
export class ChordsLocalDatabase {

    private static readonly chordSheetDb = "chord-sheets-db";
    private static readonly chordSheetDbVersion = 8;
    private static readonly chordStore = "chord-store";
    private static readonly songIndex = "songIndex";
    private static readonly artistIndex = "artistIndex";
    private static readonly searchTermIndexes = ["search-term-1-index", "search-term-2-index", "search-term-3-index", "search-term-4-index", "search-term-5-index"];

    /**
     * Adds a chord sheet to the cache.
     * @param chord The chord sheet to add.
     */
    public async add(chord: ChordSheet): Promise<void> {
        const store = await this.openChordsStore("readwrite");
        const doc = this.chordSheetToDbDoc(chord);
        const addRequest = store.put(doc);
        const result = new Promise<void>((resolve, reject) => {
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = e => reject(e);
        });
        await result;
    }

    /**
     * Gets a chord sheet from the chord cache.
     * @param chordId The ID of the chord sheet to get.
     * @returns A chord sheet, or null if not found.
     */
    public async get(chordId: string): Promise<ChordSheet | null> {
        const store = await this.openChordsStore("readonly");
        const chordRequest = store.get(this.normalizeChordId(chordId));
        const chordTask = new Promise<ChordSheet | null>((resolve, reject) => {
            chordRequest.onsuccess = () => resolve(chordRequest.result as ChordSheet | null);
            chordRequest.onerror = e => {
                console.warn("Error fetching chord sheet from indexDB", chordId, e); reject(e); 
            };
        });

        return await chordTask;
    }

    /**
     * Returns whether a chord chart already exists in the offline cache.
     */
    public async has(chordId: string): Promise<boolean> {
        const store = await this.openChordsStore("readonly");
        const keyRequest = store.getKey(this.normalizeChordId(chordId));
        return await new Promise<boolean>((resolve, reject) => {
            keyRequest.onsuccess = () => resolve(keyRequest.result !== undefined);
            keyRequest.onerror = e => reject(e);
        });
    }

    /**
     * Deletes all cached chord charts from IndexedDB.
     */
    public async deleteAll(): Promise<void> {
        const store = await this.openChordsStore("readwrite");
        const clearRequest = store.clear();
        await new Promise<void>((resolve, reject) => {
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = e => reject(e);
        });
    }

    /**
     * Searches the cache for chord sheets matching the specified query.
     */
    public search(query: string): Promise<ChordSheet[]> {
        return this.queryIndexes(query.toLowerCase());
    }

    /**
     * Searches the cache for chord sheets matching the specified query.
     */
    public async searchPaged(query: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const rawResults = await this.queryIndexes(query.toLowerCase());
        return {
            skip: skip,
            take: take,
            results: rawResults.slice(skip, skip + take),
            totalCount: rawResults.length
        };
    }

    /**
     * Gets chords in the cache ordered by song name.
     * @param skip The number of items to skip.
     * @param take The number of items to take.
     * @returns A paged result containing the chords ordered by name.
     */
    public async getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const store = await this.openChordsStore("readonly");
        return await this.getIndexResultsPaged(ChordsLocalDatabase.songIndex, null, store, skip, take);
    }

    public async getBySongGroup(group: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const normalizedGroup = (group || "").trim().toLowerCase();
        if (!normalizedGroup) {
            return {
                skip,
                take,
                results: [],
                totalCount: 0
            };
        }

        const store = await this.openChordsStore("readonly");
        const allSongs = await this.getIndexResults(ChordsLocalDatabase.songIndex, null, store);
        const filteredSongs = normalizedGroup === "0-9"
            ? allSongs.filter(c => /^\d/.test((c.song || "").trim()))
            : allSongs.filter(c => (c.song || "").toLowerCase().startsWith(normalizedGroup));

        return {
            skip,
            take,
            results: filteredSongs.slice(skip, skip + take),
            totalCount: filteredSongs.length
        };
    }

    /**
     * Loads artists by name from the cache.
     * @param artist
     * @param skip
     * @param take
     * @returns
     */
    public async getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const store = await this.openChordsStore("readonly");
        const query = artist ? IDBKeyRange.only(artist.toLowerCase()) : null;
        return await this.getIndexResultsPaged(ChordsLocalDatabase.artistIndex, query, store, skip, take);
    }

    /**
     * Loads random chords from the cache.
     * @param take The maximum number of chords to load.
     * @returns
     */
    public async getRandom(take: number): Promise<ChordSheet[]> {
        const store = await this.openChordsStore("readonly");
        const totalCount = await this.countTotalStoreResults(store);

        // If we don't have enough items in the cache, just return what we've got.
        if (totalCount <= take) {
            return await this.getIndexResults(ChordsLocalDatabase.songIndex, null, store);
        }

        const skipValues = this.generateRandomUniqueInts(0, totalCount, take);
        const randomChordFetches = skipValues.map(skip => this.getIndexResultsPaged(ChordsLocalDatabase.songIndex, null, store, skip, 1));
        const randomChords = await Promise.all(randomChordFetches);
        const results: ChordSheet[] = [];
        randomChords.forEach(c => results.push(c.results[0]));
        return results;
    }

    /**
     * Gets a list of the artists for all the chord sheets.
     * @returns
     */
    public async getAllArtists(): Promise<string[]> {
        const store = await this.openChordsStore("readonly");
        const chordSheets = await this.getIndexResults(ChordsLocalDatabase.artistIndex, null, store);
        return Array.from(new Set(chordSheets.map(c => c.artist)));
    }

    public async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        // TODO: we need to implement a new created date index.
        const store = await this.openChordsStore("readonly");
        return await this.getIndexResultsPaged(ChordsLocalDatabase.songIndex, null, store, skip, take);
    }

    private openDatabase(): Promise<IDBDatabase> {
        if (!window.indexedDB) {
            return Promise.reject("IndexDB not supported");
        }

        return new Promise<IDBDatabase>((resolve, reject) => {
            const openReq = indexedDB.open(ChordsLocalDatabase.chordSheetDb, ChordsLocalDatabase.chordSheetDbVersion);
            openReq.onsuccess = () => resolve(openReq.result);

            openReq.onerror = (e) => {
                this.getExistingDatabaseVersion()
                    .then(existingVersion => reject(this.createOpenDatabaseError(openReq, e, existingVersion)))
                    .catch(() => reject(this.createOpenDatabaseError(openReq, e, null)));
            };

            openReq.onblocked = () => {
                reject(new Error(`Error opening IndexedDB '${ChordsLocalDatabase.chordSheetDb}': request was blocked. Try closing other tabs/windows for this site and retry.`));
            };

            openReq.onupgradeneeded = (e) => {
                try {
                    this.createDatabase(e);
                } catch (creationError) {
                    reject(creationError);
                }
            };
        });
    }

    private createDatabase(e: IDBVersionChangeEvent) {
        const openReq = e.target as IDBOpenDBRequest | null;
        if (!openReq) {
            throw new Error("Unable to upgrade IndexedDB: missing open request target");
        }

        const db = openReq.result;
        const upgradeTransaction = openReq.transaction;
        if (!upgradeTransaction) {
            throw new Error("Unable to upgrade IndexedDB: missing upgrade transaction");
        }

        const chordStore = db.objectStoreNames.contains(ChordsLocalDatabase.chordStore)
            ? upgradeTransaction.objectStore(ChordsLocalDatabase.chordStore)
            : db.createObjectStore(ChordsLocalDatabase.chordStore, {
                keyPath: "id"
            });

        if (!chordStore.indexNames.contains(ChordsLocalDatabase.songIndex)) {
            chordStore.createIndex(ChordsLocalDatabase.songIndex, "songLowered", { unique: false });
        }

        if (!chordStore.indexNames.contains(ChordsLocalDatabase.artistIndex)) {
            chordStore.createIndex(ChordsLocalDatabase.artistIndex, "artistLowered", { unique: false });
        }

        ChordsLocalDatabase.searchTermIndexes.forEach((indexName, i) => {
            if (!chordStore.indexNames.contains(indexName)) {
                chordStore.createIndex(indexName, `searchTerm${i + 1}`, { unique: false });
            }
        });
    }

    private createOpenDatabaseError(openReq: IDBOpenDBRequest, event: Event, existingVersion: number | null): Error {
        const domError = openReq.error;
        const details: string[] = [
            `Error opening IndexedDB '${ChordsLocalDatabase.chordSheetDb}'`,
            `requestedVersion=${ChordsLocalDatabase.chordSheetDbVersion}`,
            `readyState=${openReq.readyState}`
        ];

        if (existingVersion !== null) {
            details.push(`existingVersion=${existingVersion}`);
        }

        if (domError) {
            details.push(`name=${domError.name}`);
            details.push(`message=${domError.message}`);
        }

        if (domError?.name === "VersionError") {
            details.push("hint=Requested version is older than the existing database. A stale client bundle or old service worker may be using an outdated schema version");
        }

        const eventType = (event && "type" in event) ? event.type : "unknown";
        details.push(`eventType=${eventType}`);
        return new Error(details.join("; "));
    }

    private getExistingDatabaseVersion(): Promise<number | null> {
        return new Promise<number | null>((resolve) => {
            const inspectReq = indexedDB.open(ChordsLocalDatabase.chordSheetDb);
            inspectReq.onsuccess = () => {
                const db = inspectReq.result;
                const version = db.version;
                db.close();
                resolve(version);
            };
            inspectReq.onerror = () => resolve(null);
            inspectReq.onblocked = () => resolve(null);
        });
    }

    private async openChordsStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.openDatabase();
        const tx = db.transaction([ChordsLocalDatabase.chordStore], mode);
        return tx.objectStore(ChordsLocalDatabase.chordStore);
    }

    private async queryIndexes(value: string): Promise<ChordSheet[]> {
        const store = await this.openChordsStore("readonly");
        const query = IDBKeyRange.only(value);

        const chordResults = this.getIndexResults(ChordsLocalDatabase.songIndex, query, store);
        const artistResults = this.getIndexResults(ChordsLocalDatabase.artistIndex, query, store);
        const searchTermResults = [0, 1, 2, 3, 4].map(i => this.getIndexResults(ChordsLocalDatabase.searchTermIndexes[i], query, store));

        const allResults = new Map<string, ChordSheet>();
        const resultTasks = await Promise.all([chordResults, artistResults, ...searchTermResults]);
        resultTasks.forEach(sheets => sheets.forEach(s => allResults.set(s.id, s)));

        return Array.from(allResults.values());
    }

    private getIndexResults(indexName: string, query: IDBKeyRange | null, store: IDBObjectStore): Promise<ChordSheet[]> {
        const index = store.index(indexName);
        const cursor = index.openCursor(query);
        const results: ChordSheet[] = [];
        return new Promise<ChordSheet[]>((resolve, reject) => {
            cursor.onsuccess = e => {
                const cursorResult = (e.target as any).result as IDBCursorWithValue | null;
                if (cursorResult) {
                    results.push(cursorResult.value as ChordSheet);
                    cursorResult.continue();
                } else {
                    resolve(results);
                }
            };
            cursor.onerror = e => reject(e);
        });
    }


    private async getIndexResultsPaged(indexName: string, query: IDBKeyRange | null, store: IDBObjectStore, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const index = store.index(indexName);
        const results: ChordSheet[] = [];

        const totalCount = await this.countIndexQueryTotalResults(index, query);

        // Query the index.
        let currentSkip = 0;
        const cursor = index.openCursor(query);
        const chordSheets = await new Promise<ChordSheet[]>((resolve, reject) => {
            cursor.onsuccess = e => {
                const cursorResult = (e.target as any).result as IDBCursorWithValue | null;
                if (cursorResult) {
                    // If we'vce skipped enough, add results.
                    if (skip <= currentSkip) {
                        results.push(cursorResult.value as ChordSheet);
                    }

                    // Do we reach our max length (take)? Resolve with that.
                    if (results.length === take) {
                        resolve(results);
                    } else {
                        cursorResult.continue();
                        currentSkip++;
                    }
                } else {
                    // no more results. Resolve.
                    resolve(results);
                }
            };
            cursor.onerror = e => reject(e);
        });

        return {
            skip: skip,
            take: take,
            results: chordSheets,
            totalCount: totalCount
        };
    }

    // private getIndexKeys(indexName: string, query: IDBKeyRange | null, store: IDBObjectStore): Promise<string[]> {
    //     const index = store.index(indexName);
    //     const cursorReq = index.openKeyCursor(query);
    //     const results: string[] = [];
    //     return new Promise<string[]>((resolve, reject) => {
    //         cursorReq.onsuccess = e => {
    //             const cursorResult = (e.target as any).result as IDBCursorWithValue | null;
    //             if (cursorResult) {
    //                 results.push(cursorResult.key.toString());
    //                 cursorResult.continue();
    //             } else {
    //                 resolve(results);
    //             }
    //         };
    //         cursorReq.onerror = e => reject(e);
    //     });
    // }

    private countIndexQueryTotalResults(index: IDBIndex, query: IDBKeyRange | null): Promise<number> {
        // Cheap route: if we don't have a query, we can just count the index results.
        if (!query) {
            const totalCountRequest = index.count();
            return new Promise<number>((resolve, reject) => {
                totalCountRequest.onsuccess = e => resolve((e.target as any).result as number || 0);
                totalCountRequest.onerror = e => reject(e);
            });
        }

        // We have a query, so we'll need to compute the total count manually.
        const cursorRequest = index.openKeyCursor(query);
        let totalCount = 0;
        return new Promise<number>((resolve, reject) => {
            cursorRequest.onsuccess = e => {
                const cursorResult = (e.target as any).result as IDBCursorWithValue | null;
                if (cursorResult) {
                    totalCount++;
                    cursorResult.continue();
                } else {
                    resolve(totalCount);
                }
            };
            cursorRequest.onerror = e => reject(e);
        });
    }

    private countTotalStoreResults(store: IDBObjectStore): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const countReq = store.count();
            countReq.onsuccess = e => resolve((e.target as any).result as number);
            countReq.onerror = e => reject(e);
        });
    }

    private generateRandomInteger(min: number, max: number) {
        return Math.floor(min + Math.random()*(max - min + 1));
    }

    private generateRandomUniqueInts(min: number, max: number, resultLength: number): number[] {
        if (min > max) {
            throw new Error("Min must be <= max");
        }

        // If we can't possibly generate the desired result length, well, just generate what we're able.
        const results = new Set<number>();
        for (let i = 0; i < resultLength; i++) {
            results.add(this.generateRandomInteger(min, max));
        }

        return Array.from(results);
    }

    private chordSheetToDbDoc(chordSheet: ChordSheet): ChordSheetDbDoc {
        const wordsList = [
            ...this.getWords(chordSheet.song),
            ...this.getWords(chordSheet.artist)
        ];
        const termsSet = new Set<string>(wordsList);
        const terms = Array.from(termsSet);
        return {
            ...chordSheet,
            id: chordSheet.id.toLowerCase(),
            songLowered: chordSheet.song.toLowerCase(),
            artistLowered: chordSheet.artist.toLowerCase(),
            searchTerm1: (terms[0] || "").toLocaleLowerCase(),
            searchTerm2: (terms[1] || "").toLocaleLowerCase(),
            searchTerm3: (terms[2] || "").toLocaleLowerCase(),
            searchTerm4: (terms[3] || "").toLocaleLowerCase(),
            searchTerm5: (terms[4] || "").toLocaleLowerCase()
        };
    }

    private getWords(input: string): string[] {
        return input.split(/\s|,/); // space or comma
    }

    private normalizeChordId(chordId: string): string {
        return (chordId || "").toLowerCase();
    }
}

// in lieu of full text indexing, we create indexes on each searchable word of a chord sheet title.
interface ChordSheetDbDoc extends ChordSheet {
    songLowered: string;
    artistLowered: string;
    searchTerm1: string;
    searchTerm2: string;
    searchTerm3: string;
    searchTerm4: string;
    searchTerm5: string;
}