import { ChordSheet, PagedResult } from "../models/interfaces";

/**
 * Interface for a chord sheeet fetching service.
 * We have two implementations: one for online use (API) and one for offline use (IndexDB cache).
 */
export interface ChordFetchBackend {
    getById(chordId: string): Promise<ChordSheet>;
    getByOrderedIndex(index: number): Promise<string | null>;
    getMyStarred(): Promise<ChordSheet[]>;
    search(query: string): Promise<ChordSheet[]>;
    searchPaged(query: string, skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByRandom(take: number): Promise<ChordSheet[]>;
    getAllArtists(): Promise<string[]>;
    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void>;
    getCacheableChords(): Promise<ChordSheet[]>;
}