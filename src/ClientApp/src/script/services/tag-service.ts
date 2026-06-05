import { ChordSheet } from "../models/interfaces";
import { ApiServiceBase } from "./api-service-base";

/**
 * Service for interacting with tag-related API endpoints.
 */
export class TagService extends ApiServiceBase {
    constructor() {
        super();
    }

    /**
     * Fetches all available tags.
     */
    getAllTags(): Promise<string[]> {
        return super.getJson("/tags/GetAll");
    }

    /**
     * Fetches all chord sheets for a specific tag.
     * @param tag The tag to filter by.
     * @returns A list of chord sheets with that tag.
     */
    getChordSheetsByTag(tag: string): Promise<ChordSheet[]> {
        return super.getJson("/tags/GetChordSheetsByTag", { tag });
    }
}

export const tagService = new TagService();