import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { PagedList } from "../models/paged-list";
import { sharedStyles } from "../common/shared.styles";
import { browseArtistsStyles } from "./browse-artists.styles";
import "../components/chord-collection";
import "../components/load-more-button";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";

type ArtistGroup = {
    artist: string;
    chordList: PagedList<ChordSheet> | null;
};

@customElement("browse-artists")
export class BrowseArtists extends LitElement {
    static styles = [browseArtistsStyles, sharedStyles];

    @property({ type: String, attribute: "jump-to-artist" }) jumpToArtist = "";
    @state() private artistGroups: ArtistGroup[] = [];
    @state() private loading = true;
    @state() private error: string | null = null;
    @state() private selectedArtist = "";

    private readonly chordService = new ChordService();

    connectedCallback(): void {
        super.connectedCallback();
        this.loadArtists().catch(error => {
            console.error("Failed loading artists", error);
            this.error = "Unable to load artists right now. Please try again.";
            this.loading = false;
        });
    }

    private async loadArtists(): Promise<void> {
        const artists = await this.chordService.getAllArtists();
        this.artistGroups = artists
            .filter(a => !!a)
            .map(artist => ({
                artist,
                chordList: null
            }));

        this.loading = false;
        await this.updateComplete;
        this.autoExpandRequestedArtist();
    }

    private autoExpandRequestedArtist(): void {
        const requestedArtist = this.getRequestedArtist();
        if (!requestedArtist) {
            return;
        }

        const artistIndex = this.findArtistIndex(requestedArtist);
        if (artistIndex >= 0) {
            this.loadArtistChords(artistIndex);
        }

        const artistKey = this.artistKey(requestedArtist);
        const details = this.renderRoot.querySelector<HTMLElement>(`wa-details[data-artist-key="${artistKey}"]`) as HTMLElement & { open?: boolean };
        if (!details) {
            return;
        }

        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
        this.selectedArtist = encodeURIComponent(requestedArtist);
    }

    private onArtistSelectChanged(e: Event): void {
        const selectedArtist = ((e.target as HTMLInputElement).value || "").trim();
        this.selectedArtist = selectedArtist;
        if (!selectedArtist) {
            history.replaceState({}, "", "/browse/artists");
            return;
        }

        const decodedArtist = decodeURIComponent(selectedArtist);
        const artistIndex = this.findArtistIndex(decodedArtist);
        if (artistIndex >= 0) {
            this.loadArtistChords(artistIndex);
        }

        history.replaceState({}, "", `/browse/artists?jump-to-artist=${encodeURIComponent(decodedArtist)}`);

        const details = this.renderRoot.querySelector<HTMLElement>(`wa-details[data-artist-key="${this.artistKey(decodedArtist)}"]`) as HTMLElement & { open?: boolean };
        if (!details) {
            return;
        }

        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    private onArtistDetailsShow(index: number): void {
        this.loadArtistChords(index);
    }

    private loadArtistChords(index: number): void {
        const group = this.artistGroups[index];
        if (!group || group.chordList) {
            return;
        }

        const list = new PagedList<ChordSheet>((skip, take) => this.chordService.getByArtistName(group.artist, skip, take));
        list.take = 100;
        list.addEventListener("changed", () => this.requestUpdate());
        group.chordList = list;
        this.artistGroups = [...this.artistGroups];
        list.fetch();
    }

    private getRequestedArtist(): string | null {
        const fromQuery = new URLSearchParams(window.location.search).get("jump-to-artist");
        const requested = (fromQuery || this.jumpToArtist || "").trim();
        return requested || null;
    }

    private artistKey(artist: string): string {
        return encodeURIComponent(artist.toLocaleLowerCase());
    }

    private findArtistIndex(artist: string): number {
        const key = artist.toLocaleLowerCase();
        return this.artistGroups.findIndex(g => g.artist.toLocaleLowerCase() === key);
    }

    render(): TemplateResult {
        if (this.loading) {
            return html`
                <div class="container py-4">
                    <h2 class="highlight">Songs By Artist</h2>
                    <p>Loading artists...</p>
                </div>
            `;
        }

        if (this.error) {
            return html`
                <div class="container py-4">
                    <h2 class="highlight">Songs By Artist</h2>
                    <p class="text-danger">${this.error}</p>
                </div>
            `;
        }

        return html`
            <div class="container py-4">
                <div class="artist-header-row mb-3">
                    <h2 class="highlight mb-0">Songs By Artist</h2>
                    <wa-select
                        class="artist-jump-select"
                        placeholder="Jump to artist"
                        value="${this.selectedArtist}"
                        @wa-change="${this.onArtistSelectChanged}">
                        ${repeat(this.artistGroups, g => g.artist, g => html`<wa-option value="${encodeURIComponent(g.artist)}">${g.artist}</wa-option>`) }
                    </wa-select>
                </div>

                ${this.artistGroups.length === 0 ? html`<p>No artists found.</p>` : html``}
                ${repeat(this.artistGroups, g => g.artist, (g, i) => this.renderArtistGroup(g, i))}
            </div>
        `;
    }

    private renderArtistGroup(group: ArtistGroup, index: number): TemplateResult {
        return html`
            <wa-details
                class="artist-details mb-3"
                data-artist-index="${index}"
                data-artist-key="${this.artistKey(group.artist)}"
                ?open="${this.getRequestedArtist()?.toLocaleLowerCase() === group.artist.toLocaleLowerCase()}"
                @wa-show="${() => this.onArtistDetailsShow(index)}">
                <div slot="summary" class="artist-summary-text">${group.artist}</div>
                <div class="artist-content">
                    ${group.chordList ? html`
                        <chord-collection .chords="${group.chordList}"></chord-collection>
                        <div class="text-center mt-3">
                            <load-more-button .list="${group.chordList}"></load-more-button>
                        </div>
                    ` : html`<p>Loading songs...</p>`}
                </div>
            </wa-details>
        `;
    }
}