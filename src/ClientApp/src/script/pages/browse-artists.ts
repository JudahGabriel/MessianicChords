import { CSSResult, html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components/chord-card";
import "../components/chord-card-loading";
import "../components/load-more-button";
import { ChordSheet, PagedResult } from "../models/interfaces";
import { BootstrapBase } from "../common/bootstrap-base";
import { BrowseSongs } from "./browse-songs";
import { repeat } from "lit/directives/repeat.js";
import { browseArtistsStyles } from "./browse-artists.styles";
import "@shoelace-style/shoelace/dist/components/select/select.js";
import "@shoelace-style/shoelace/dist/components/option/option.js";

// This component is the same as browse songs, only the grouping is by artist, rather than by first letter of song name.
// So, let's just inherit from BrowseSongs.
@customElement("browse-artists")
export class BrowseArtists extends BrowseSongs {
    @state() artists: string[] = [];

    static styles = [
        BootstrapBase.styles,
        BrowseSongs.styles,
        browseArtistsStyles
    ] as CSSResult[];

    constructor() {
        super();
    }

    protected firstUpdated(changedProps: Map<string | number | symbol, unknown>): void {
        super.firstUpdated(changedProps);
        this.chordService.getAllArtists()
            .then(a => this.artists = a);
    }

    renderAdditionalContainerContent(): TemplateResult {
        return this.renderAllArtistsDropdown();
    }

    renderAllArtistsDropdown(): TemplateResult {
        return html`
            <div class="artist-header-row mb-4 mb-sm-0">
                <h2 class="highlight mb-0">Songs By Artist</h2>
                <sl-select
                    id="artistSelect"
                    class="artist-jump-select"
                    placeholder="Jump to artist"
                    @sl-change="${this.jumpToArtistChanged}">
                    ${repeat(this.artists, a => a, a => this.renderArtist(a))}
                </sl-select>
            </div>
        `;
    }

    renderArtist(artistName: string): TemplateResult {
        if (!artistName) {
            return html``;
        }
        const artistValue = encodeURIComponent(artistName);
        return html`
            <sl-option value="${artistValue}">${artistName}</sl-option>
        `;
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const chunk = await this.chordService.getByArtistName(null, skip, take);

        // Sort them into our artist group.
        chunk.results.forEach(c => this.addToArtistGroup(c));

        return chunk;
    }

    addToArtistGroup(chord: ChordSheet) {
        const artist = chord.artist;
        if (artist) {
            const chordsGroup = this.chordGrouping[artist];
            if (chordsGroup) {
                chordsGroup.push(chord);
            } else {
                this.chordGrouping[artist] = [chord];
            }
        }
    }

    jumpToArtistChanged(e: Event) {
        const input = e.target as HTMLInputElement;
        const selectedArtist = input?.value ? decodeURIComponent(input.value) : "";
        // If we selected an artist, jump to them.
        if (selectedArtist && this.artists.includes(selectedArtist)) {
            window.location.href = `/artist/${encodeURIComponent(selectedArtist)}`;
        }
    }
}