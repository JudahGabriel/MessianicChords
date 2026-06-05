import { CSSResult } from "lit";
import { customElement } from "lit/decorators.js";
import { BootstrapBase } from "../common/bootstrap-base";
import { ChordSheet, PagedResult } from "../models/interfaces";
import { BrowseArtists } from "./browse-artists";
import { RouteLocation } from "../common/route-location";

// This is the same functionality as browse artists page, only with a single artist
// So, we inherit from that page and just tweak it to display this artist.
@customElement("artist-songs")
export class ArtistSongs extends BrowseArtists {
    location: RouteLocation | null = null;

    static styles = [
        BootstrapBase.styles,
        BrowseArtists.styles
    ] as CSSResult[];

    constructor() {
        super();
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const artistName = this.location?.params?.["name"] as string || null;
        const chunk = await this.chordService.getByArtistName(artistName, skip, take);

        // Sort them into our artist group.
        chunk.results.forEach(c => this.addToArtistGroup(c));

        return chunk;
    }
}