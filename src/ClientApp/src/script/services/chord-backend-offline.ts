import { ChordSheet, PagedResult } from "../models/interfaces";
import { ChordCache } from "./chord-cache";
import { ChordFetchBackend } from "./chord-fetch-backend";

/**
 * Implementation of ChordFetchService that loads chords from the local Chord Cache. Intended for use when offline.
 */
export class CacheBackend implements ChordFetchBackend {
    private chordCache: ChordCache | null = null;

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

    async getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.getBySongName(skip, take);
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

    async getChordCache(): Promise<ChordCache> {
        if (!this.chordCache) {
            const module = await import("./chord-cache");
            this.chordCache = new module.ChordCache();
        }

        return this.chordCache;
    }

    submitChordEdit(_: ChordSheet, __: File[]): Promise<void> {
        throw new Error("Can't upload chords while offline.");
    }

    async getCacheableChords(): Promise<ChordSheet[]> {
        throw new Error("Not supported while offline");
    }
}