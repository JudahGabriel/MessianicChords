import { ChordSheet } from "../models/interfaces";
import { PagedResult } from "../models/paged-result";
import { ApiServiceBase } from "./api-service-base";

export class ChordService extends ApiServiceBase {
    getById(chordId: string): Promise<ChordSheet> {
        return super.get("/chords/get", { id: chordId });
    }

    search(query: string): Promise<ChordSheet[]> {
        return super.get("/chords/search", { search: query });
    }

    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.get("/chords/getBySongName", args);
    }

    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args: any = {
            skip,
            take
        };
        const url = artist ? "/chords/getArtistSongs" : "/chords/getByArtistName";
        if (artist) {
            args.artist = artist;
        }
        return super.get(url, args);
    }

    getByRandom(take: number): Promise<ChordSheet[]> {
        const args = {
            take
        };
        return super.get("/chords/getByRandom", args);
    }

    getAllArtists(): Promise<string[]> {
        return super.get("/chords/getAllArtists");
    }

    async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.get("/chords/getNew", args);
    }

    downloadUrlFor(id: string): string {
        return `${this.apiUrl}/chords/download?id=${id}`;
    }
}