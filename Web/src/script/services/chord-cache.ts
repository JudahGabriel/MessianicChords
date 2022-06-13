import { ChordSheet } from "../models/interfaces";

/**
 * Cache of ChordSheet objects. Used for offline search.
 */
export class ChordCache {

    private static readonly chordSheetDb = "chord-sheets-db";
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
        var result = new Promise<void>((resolve, reject) => {
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
        const chordRequest = store.get(chordId);
        const chordTask = new Promise<ChordSheet | null>((resolve, reject) => {
            chordRequest.onsuccess = () => resolve(chordRequest.result as ChordSheet | null);
            chordRequest.onerror = e => { console.warn("Error fetching chord sheet from indexDB", chordId, e); reject(e); }
        });

        return await chordTask;
    }

    /**
     * Searches the cache for chord sheets matching the specified query.
     */
    public async query(query: string): Promise<ChordSheet[]> {
        const res = await this.queryIndexes(query.toLowerCase());
        console.log("quering", query.toLowerCase(), "returning", res);
        return res;
    }

    private openDatabase(): Promise<IDBDatabase> {
        if (!window.indexedDB) {
            return Promise.reject("IndexDB not supported");
        }

        return new Promise<IDBDatabase>((resolve, reject) => {
            const openReq = indexedDB.open(ChordCache.chordSheetDb, 4);
            openReq.onsuccess = (e) => {
                const db = (e.target as any).result as IDBDatabase;
                resolve(db);
            }

            openReq.onerror = (e) => reject(`Error opening database: ${e}`);

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
        const db = (e.target as any).result as IDBDatabase;
        const chordStore = db.createObjectStore(ChordCache.chordStore, {
            keyPath: "id"
        });
        chordStore.createIndex(ChordCache.songIndex, "songLowered", { unique: false });
        chordStore.createIndex(ChordCache.artistIndex, "artistLowered", { unique: false });
        ChordCache.searchTermIndexes.forEach((indexName, i) => chordStore.createIndex(indexName, `searchTerm${i+1}`, { unique: false }));
    }

    private async openChordsStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.openDatabase();
        const tx = db.transaction([ChordCache.chordStore], mode);
        return tx.objectStore(ChordCache.chordStore);
    }

    private async queryIndexes(value: string): Promise<ChordSheet[]> {
        const store = await this.openChordsStore("readonly");
        const query = IDBKeyRange.only(value);

        // First, see how many total results there are by doing the cheaper key cursor.
        const chordResults = this.getIndexResults(ChordCache.songIndex, query, store);
        const artistResults = this.getIndexResults(ChordCache.artistIndex, query, store);
        const searchTermResults = [0, 1, 2, 3, 4].map(i => this.getIndexResults(ChordCache.searchTermIndexes[i], query, store));

        const allResults = new Map<string, ChordSheet>();
        const resultTasks = await Promise.all([chordResults, artistResults, ...searchTermResults]);
        resultTasks.forEach(sheets => sheets.forEach(s => allResults.set(s.id, s)));

        return Array.from(allResults.values());
    }

    private getIndexResults(indexName: string, query: IDBKeyRange, store: IDBObjectStore): Promise<ChordSheet[]> {
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

    private chordSheetToDbDoc(chordSheet: ChordSheet): ChordSheetDbDoc {
        const wordsList = [
            ...this.getWords(chordSheet.song),
            ...this.getWords(chordSheet.artist)
        ];
        const termsSet = new Set<string>(wordsList);
        const terms = Array.from(termsSet);
        return {
            ...chordSheet,
            songLowered: chordSheet.song.toLowerCase(),
            artistLowered: chordSheet.artist.toLowerCase(),
            searchTerm1: (terms[0] || "").toLocaleLowerCase(),
            searchTerm2: (terms[1] || "").toLocaleLowerCase(),
            searchTerm3: (terms[2] || "").toLocaleLowerCase(),
            searchTerm4: (terms[3] || "").toLocaleLowerCase(),
            searchTerm5: (terms[4] || "").toLocaleLowerCase()
        }
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