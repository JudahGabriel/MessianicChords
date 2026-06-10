import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ChordSheet } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordService } from "../services/chord-service";
import { sharedStyles } from "../common/shared.styles";
import { browseArtistsStyles } from "./browse-artists.styles";
import "../components/chord-collection";
import "../components/load-more-button";
import { appTitle } from "../../services/app-router";

@customElement("artist-songs")
export class ArtistSongs extends LitElement {
    static styles = [sharedStyles, browseArtistsStyles];

    @property({ attribute: "artist-name" }) artistName = "";

    @state() private chords = PagedList.empty<ChordSheet>();
    @state() private error: string | null = null;

    private readonly chordService = new ChordService();

    connectedCallback(): void {
        super.connectedCallback();
        this.loadFromArtistName();
    }

    updated(changedProps: Map<string | number | symbol, unknown>): void {
        if (changedProps.has("artistName")) {
            this.loadFromArtistName();
        }
    }

    private loadFromArtistName(): void {
        const artist = decodeURIComponent(this.artistName || "").trim();
        this.error = null;

        if (!artist) {
            this.chords = PagedList.empty<ChordSheet>();
            this.error = "Artist not found.";
            return;
        }

        const list = new PagedList<ChordSheet>((skip, take) =>
            this.chordService.getByArtistName(artist, skip, take)
        );
        list.take = 100;
        list.addEventListener("changed", () => this.requestUpdate());

        this.chords = list;
        list.fetch().catch(err => {
            console.error("Failed loading artist songs", err);
            this.error = "Unable to load songs for this artist right now.";
        });
    }

    render(): TemplateResult {
        const headingArtist = decodeURIComponent(this.artistName || "").trim() || "artist";
        return html`
            <div class="container py-4">
                <h2 class="highlight mb-0">Songs by ${headingArtist}</h2>

                ${this.error
                ? html`<p class="text-danger mt-3">${this.error}</p>`
                : html`
                        <div class="mt-3">
                            <chord-collection .chords="${this.chords}"></chord-collection>
                            <div class="text-center mt-3">
                                <load-more-button .list="${this.chords}"></load-more-button>
                            </div>
                        </div>
                    `}
            </div>
        `;
    }
}