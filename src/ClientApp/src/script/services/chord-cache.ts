import { ChordSheet } from "../models/interfaces";
import { PagedResult } from "../models/paged-result";

/**
 * Cache of ChordSheet objects. Used for offline search.
 */
export class ChordCache {

    private static readonly chordSheetDb = "chord-sheets-db";
    private static readonly chordStore = "chord-store";
    private static readonly songIndex = "songIndex";
    private static readonly artistIndex = "artistIndex";
    private static readonly recentDateIndex = "recentIndex";
    private static readonly searchTermIndexes = ["search-term-1-index", "search-term-2-index", "search-term-3-index", "search-term-4-index", "search-term-5-index"];

    /**
     * Adds a chord sheet to the cache.
     * @param chord The chord sheet to add.
     */
    public async add(chord: ChordSheet): Promise<ChordSheetDbDoc> {
        const store = await this.openChordsStore("readwrite");
        const doc = this.chordSheetToDbDoc(chord);    
        const addRequest = store.put(doc);
        return new Promise<ChordSheetDbDoc>((resolve, reject) => {
            addRequest.onsuccess = () => resolve(doc);
            addRequest.onerror = e => reject(e ?? addRequest.error);
        });
    }

    /**
     * Gets a chord sheet from the chord cache.
     * @param chordId The ID of the chord sheet to get.
     * @returns A chord sheet, or null if not found.
     */
    public async get(chordId: string): Promise<ChordSheet | null> {
        const store = await this.openChordsStore("readonly");
        const chordRequest = store.get(chordId.toLowerCase());
        
        const chordTask = new Promise<ChordSheet | null>((resolve, reject) => {
            chordRequest.onsuccess = () => {
                resolve(chordRequest.result as ChordSheet | null);
            };
            chordRequest.onerror = e => { console.warn("Error fetching chord sheet from indexDB", chordId.toLowerCase(), e); reject(e); }
        });

        return await chordTask;
    }

    /**
     * Searches the cache for chord sheets matching the specified query.
     */
    public search(query: string): Promise<ChordSheet[]> {
        return this.queryIndexes(query.toLowerCase());
    }

    /**
     * Gets chords in the cache ordered by song name.
     * @param skip The number of items to skip.
     * @param take The number of items to take.
     * @returns A paged result containing the chords ordered by name.
     */
    public async getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const store = await this.openChordsStore("readonly");
        return await this.getIndexResultsPaged(ChordCache.songIndex, null, store, skip, take);
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
        return await this.getIndexResultsPaged(ChordCache.artistIndex, query, store, skip, take);
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
            return await this.getIndexResults(ChordCache.songIndex, null, store);
        }

        const skipValues = this.generateRandomUniqueInts(0, totalCount, take);
        const randomChordFetches = skipValues.map(skip => this.getIndexResultsPaged(ChordCache.songIndex, null, store, skip, 1));
        const randomChords = await Promise.all(randomChordFetches);
        const results: ChordSheet[] = [];
        randomChords.forEach(c => results.push(c.results[0]));
        return results;
    }

    /**
     * Gets all the chords in the cache.
     * @param skip The number of chords to skip.
     * @param take The maximum number of chords to load.
     * @returns An array containing the chord charts.
     */
    public async getAll(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const store = await this.openChordsStore("readonly");
        const totalCount = await this.countTotalStoreResults(store);

        // If we don't have enough items in the cache, just return what we've got.
        if (totalCount <= take) {
            const allResults = await this.getIndexResults(ChordCache.songIndex, null, store);
            return new PagedResult<ChordSheet>(skip, take, allResults, totalCount);
        }

        return await this.getIndexResultsPaged(ChordCache.songIndex, null, store, skip, take);
    }

    /**
     * Gets a list of the artists for all the chord sheets.
     * @returns
     */
    public async getAllArtists(): Promise<string[]> {
        const store = await this.openChordsStore("readonly");
        const chordSheets = await this.getIndexResults(ChordCache.artistIndex, null, store);
        return Array.from(new Set(chordSheets.map(c => c.artist)));
    }

    public async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const store = await this.openChordsStore("readonly");
        return await this.getIndexResultsPaged(ChordCache.recentDateIndex, null, store, skip, take, "prev");
    }

    private openDatabase(): Promise<IDBDatabase> {
        if (!window.indexedDB) {
            return Promise.reject("IndexDB not supported");
        }

        return new Promise<IDBDatabase>((resolve, reject) => {
            const openReq = indexedDB.open(ChordCache.chordSheetDb, 8);
            openReq.onsuccess = (e) => {
                const db = (e.target as any).result as IDBDatabase;
                resolve(db);
            }

            openReq.onerror = (e) => reject(`Error opening database: ${e}`);

            openReq.onupgradeneeded = (e) => {
                console.log("IndexDB upgrade needed. Running creation script...");
                try {
                    this.createDatabase(e, openReq.transaction!);
                    console.log("IndexDB upgrade completed.");
                } catch (creationError) {
                    reject(creationError);
                }
            };
        });
    }

    private createDatabase(e: IDBVersionChangeEvent, tx: IDBTransaction) {
        const db = (e.target as any).result as IDBDatabase;

        // Create the object store if it doesn't exist yet.
        let chordStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(ChordCache.chordStore)) {
            chordStore = db.createObjectStore(ChordCache.chordStore, {
                keyPath: "id"
            });
            console.log("Offline chord store created in IndexDB");
        } else {
            chordStore = tx.objectStore(ChordCache.chordStore);
        }        

        // Create the indexes.
        if (!chordStore.indexNames.contains(ChordCache.songIndex)) {
            chordStore.createIndex(ChordCache.songIndex, "songLowered", { unique: false });
        }
        if (!chordStore.indexNames.contains(ChordCache.artistIndex)) {
            chordStore.createIndex(ChordCache.artistIndex, "artistLowered", { unique: false });
        }
        if (!chordStore.indexNames.contains(ChordCache.recentDateIndex)) {
            chordStore.createIndex(ChordCache.recentDateIndex, "created", { unique: false });
        }
        ChordCache.searchTermIndexes.forEach((indexName, i) => {
            if (!chordStore.indexNames.contains(indexName)) {
                chordStore.createIndex(indexName, `searchTerm${i + 1}`, { unique: false });
            }
        });
    }

    private async openChordsStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.openDatabase();
        const tx = db.transaction([ChordCache.chordStore], mode);
        return tx.objectStore(ChordCache.chordStore);
    }

    private async queryIndexes(value: string): Promise<ChordSheet[]> {
        const store = await this.openChordsStore("readonly");
        const query = IDBKeyRange.only(value);

        const chordResults = this.getIndexResults(ChordCache.songIndex, query, store);
        const artistResults = this.getIndexResults(ChordCache.artistIndex, query, store);
        const searchTermResults = [0, 1, 2, 3, 4].map(i => this.getIndexResults(ChordCache.searchTermIndexes[i], query, store));

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


    private async getIndexResultsPaged(indexName: string, query: IDBKeyRange | null, store: IDBObjectStore, skip: number, take: number, direction: IDBCursorDirection = "next"): Promise<PagedResult<ChordSheet>> {
        const index = store.index(indexName);
        const results: ChordSheet[] = [];

        const totalCount = await this.countIndexQueryTotalResults(index, query);

        // Query the index.
        let currentSkip = 0;
        const cursor = index.openCursor(query, direction);
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

        return new PagedResult<ChordSheet>(skip, take, chordSheets, totalCount);
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
        })
    }

    private countTotalStoreResults(store: IDBObjectStore): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const countReq = store.count();
            countReq.onsuccess = () => resolve(countReq.result);
            countReq.onerror = e => reject(e);
        });
    }

    private generateRandomInteger(min: number, max: number) {
        return Math.floor(min + Math.random()*(max - min + 1))
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
            ...this.getWords(chordSheet.artist || ""),
            ...this.getWords((chordSheet.authors || []).join(" ")),
            ...this.getWords(chordSheet.chords || "")
        ];
        const termsSet = new Set<string>(wordsList);
        const terms = Array.from(termsSet);
        const dbDoc = {
            ...chordSheet,
            songLowered: chordSheet.song.toLowerCase(),
            artistLowered: (chordSheet.artist || "").toLowerCase(),
            searchTerm1: (terms[0] || "").toLocaleLowerCase(),
            searchTerm2: (terms[1] || "").toLocaleLowerCase(),
            searchTerm3: (terms[2] || "").toLocaleLowerCase(),
            searchTerm4: (terms[3] || "").toLocaleLowerCase(),
            searchTerm5: (terms[4] || "").toLocaleLowerCase()
        };

        // Make sure the id is lowered, otherwise we won't find chords by ID if the casing differs.
        dbDoc.id = dbDoc.id.toLowerCase();
        return dbDoc;
    }

    private getWords(input: string): string[] {
        return input.split(/\s|,/); // space or comma
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