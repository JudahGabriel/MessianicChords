import { ChordSheet, PagedResult } from "../models/interfaces";
import { filter, firstValueFrom, take } from "rxjs";
import { ApiServiceBase } from "./api-service-base";
import { CacheBackend as CacheBackendOffline } from "./chord-backend-offline";
import { ChordBackendOnline } from "./chord-backend-online";
import { ChordFetchBackend } from "./chord-fetch-backend";
import { onlineDetector } from "./online-detector";

export class ChordService extends ApiServiceBase {

    private onlineBackend = new ChordBackendOnline();
    private offlineBackend = new CacheBackendOffline();

    constructor() {
        super();
    }

    getById(chordId: string): Promise<ChordSheet> {
        return this.backend.then(b => b.getById(chordId));
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        return this.backend.then(b => b.getByOrderedIndex(index));
    }

    search(query: string): Promise<ChordSheet[]> {
        return this.backend.then(b => b.search(query));
    }

    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.backend.then(b => b.getBySongName(skip, take));
    }

    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.backend.then(b => b.getByArtistName(artist, skip, take));
    }

    getByRandom(take: number): Promise<ChordSheet[]> {
        return this.backend.then(b => b.getByRandom(take));
    }

    getAllArtists(): Promise<string[]> {
        return this.backend.then(b => b.getAllArtists());
    }

    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.backend.then(b => b.getNew(skip, take));
    }

    downloadUrlFor(chord: ChordSheet): string {
        if (chord.downloadUrl) {
            return chord.downloadUrl;
        }

        return `${this.apiUrl}/chords/download?id=${chord.id}`;
    }

    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void> {
        return this.backend.then(b => b.submitChordEdit(chord, attachments));
    }

    getCacheableChords(): Promise<ChordSheet[]> {
        return this.backend.then(b => b.getCacheableChords());
    }

    private get backend(): Promise<ChordFetchBackend> {
        // If online status has not been determined yet, wait for the first non-null value.
        if (onlineDetector.onlineStatus.value === null) {
            return firstValueFrom(
                onlineDetector.onlineStatus.pipe(
                    filter((isOnline): isOnline is boolean => isOnline !== null),
                    take(1) // automatic unsubscribe after it emits
                )
            ).then(isOnline => isOnline ? this.onlineBackend : this.offlineBackend);
        }

        return Promise.resolve(onlineDetector.onlineStatus.value ? this.onlineBackend : this.offlineBackend);
    }
}