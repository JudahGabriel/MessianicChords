import { ChordSheet, PagedResult } from "../models/interfaces";
import { ApiServiceBase } from "./api-service-base";
import { ChordsLocalDatabase } from "./chords-local-database";
import { ChordFetchBackend } from "./chord-fetch-backend";

/**
 * An implementation of ChordFetchBackend that talks to the API. Used when online.
 */
export class ChordBackendOnline extends ApiServiceBase implements ChordFetchBackend {
    private readonly chordCache = new ChordsLocalDatabase();

    async getById(chordId: string): Promise<ChordSheet> {
        return super.getJson("/chords/get", { id: chordId });
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        return super.getString("/chords/getByOrderedIndex", { index: index });
    }

    search(query: string): Promise<ChordSheet[]> {
        return super.getJson("/chords/search", { search: query });
    }

    searchPaged(query: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            search: query,
            skip,
            take
        };
        return super.getJson("/chords/searchPaged", args);
    }

    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.getJson("/chords/getBySongName", args);
    }

    getBySongGroup(group: string, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            group,
            skip,
            take
        };
        return super.getJson("/chords/getBySongGroup", args);
    }

    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args: { skip: number; take: number; artist?: string } = {
            skip,
            take
        };
        const url = artist ? "/chords/getArtistSongs" : "/chords/getByArtistName";
        if (artist) {
            args.artist = artist;
        }
        return super.getJson(url, args);
    }

    getMyStarred(): Promise<ChordSheet[]> {
        return super.getJson<ChordSheet[]>("/chords/getMyStarred")
            .then(chords => this.cacheStarredChords(chords));
    }

    getByRandom(take: number): Promise<ChordSheet[]> {
        const args = {
            take
        };
        return super.getJson("/chords/getByRandom", args);
    }

    getAllArtists(): Promise<string[]> {
        return super.getJson("/chords/getAllArtists");
    }

    async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.getJson("/chords/getNew", args);
    }

    downloadUrlFor(chord: ChordSheet): string {
        if (!chord.chords && chord.downloadUrl) {
            return chord.downloadUrl;
        }

        return `${this.apiUrl}/chords/download?id=${chord.id}`;
    }

    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void> {
        // Create a new form to hold all the chord props and attachments.
        const formData = new FormData();
        const chordProps = Object.entries(chord);
        for (const [prop,val] of chordProps) {
            if (val !== null && val !== undefined) {
                // Is it an array? Append all array values to the form.
                const arrayVal = Array.isArray(val) ? val as Array<unknown> : null;
                if (arrayVal) {
                    arrayVal.forEach(v => formData.append(prop, `${v}`));
                } else {
                    formData.append(prop, `${val}`);
                }
            }
        }

        if (attachments.length > 0) {
            attachments.forEach(a => formData.append("attachments", a, a.name));
        }

        return super.postFormData("/chordSubmissions/submitEdit", formData);
    }

    getCacheableChords(): Promise<ChordSheet[]> {
        return super.getJson("/chords/getCacheableChords");
    }

    private async cacheStarredChords(chords: ChordSheet[]): Promise<ChordSheet[]> {
        await Promise.all(chords.map(chord => this.chordCache.add(chord)));
        return chords;
    }
}