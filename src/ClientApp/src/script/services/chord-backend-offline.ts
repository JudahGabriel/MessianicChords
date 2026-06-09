import { ChordSheet, PagedResult } from "../models/interfaces";
import { accountService } from "./account-service";
import { ChordsLocalDatabase } from "./chords-local-database";
import { ChordFetchBackend } from "./chord-fetch-backend";

/**
 * Implementation of ChordFetchBackend that loads chords from the local Chord Cache in IndexDB. Intended for use when offline.
 */
export class ChordBackendOffline implements ChordFetchBackend {
    private chordCache: ChordsLocalDatabase | null = null;

    async getById(chordId: string): Promise<ChordSheet> {
        const cache = await this.getChordCache();
        const chord = await cache.get(chordId);
        if (!chord) {
            throw new Error("Couldn't find chord in cache");
        }

        return chord;
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        throw new Error(`getByOrderedIndex(${index}) is intended for online use only.`);
    }

    async search(query: string): Promise<ChordSheet[]> {
        const cache = await this.getChordCache();
        return await cache.search(query);
    }

    async searchPaged(query: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.searchPaged(query, skip, take);
    }

    async getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.getBySongName(skip, take);
    }

    async getBySongGroup(group: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.getBySongGroup(group, skip, take);
    }

    async getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.getByArtistName(artist, skip, take);
    }

    async getByRandom(take: number): Promise<ChordSheet[]> {
        const cache = await this.getChordCache();
        return await cache.getRandom(take);
    }

    async getAllArtists(): Promise<string[]> {
        const cache = await this.getChordCache();
        return await cache.getAllArtists();
    }

    async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return cache.getNew(skip, take);
    }

    async getChordCache(): Promise<ChordsLocalDatabase> {
        if (!this.chordCache) {
            const module = await import("./chords-local-database");
            this.chordCache = this.chordCache || new module.ChordsLocalDatabase();
        }

        return this.chordCache;
    }

    getMyStarred(): Promise<ChordSheet[]> {
        return this.getMyStarredFromCache();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    submitChordEdit(_: ChordSheet, __: File[]): Promise<void> {
        throw new Error("Can't upload chords while offline.");
    }

    async getCacheableChords(): Promise<ChordSheet[]> {
        throw new Error("Not supported while offline");
    }

    private async getMyStarredFromCache(): Promise<ChordSheet[]> {
        const user = accountService.currentUser;
        if (!user || !user.starredChartIds || user.starredChartIds.length === 0) {
            return [];
        }

        const cache = await this.getChordCache();
        const starredChords: ChordSheet[] = [];
        for (const chordId of user.starredChartIds) {
            const chord = await cache.get(chordId);
            if (chord) {
                starredChords.push(chord);
            }
        }

        return starredChords;
    }
}