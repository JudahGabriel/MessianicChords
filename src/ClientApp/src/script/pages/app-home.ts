import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "../components/chord-collection.js";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { appHomeStyles } from "./app-home.styles";
import { sharedStyles } from "../common/shared.styles";
import { bootstrapGridStyles } from "../common/bootstrap-grid.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
import "@shoelace-style/shoelace/dist/components/divider/divider.js";
import { PagedList } from "../models/paged-list";

@customElement("app-home")
export class AppHome extends LitElement {

    static styles = [sharedStyles, bootstrapGridStyles, bootstrapUtilities, appHomeStyles];

    @state() newChords: ChordSheet[] = [];
    @state() newChordsSkip = 0;
    @state() hasSearchResults = false;
    searchResults = new PagedList<ChordSheet>((skip, take) => this.chordService.searchPaged(this.searchText.value, skip, take));
    readonly chordService = new ChordService();
    readonly searchText = new BehaviorSubject("");

    constructor() {
        super();

        this.searchResults.addEventListener("changed", () => this.hasSearchResults = this.searchResults.items.length > 0);
    }

    connectedCallback() {
        super.connectedCallback();

        // See if we're configured to run a query.
        if (window.location.search) {
            const query = new URLSearchParams(window.location.search).get("search");
            this.searchText.next(query || "");
        }

        // Listen for search text changed (debounced).
        this.searchText
            .pipe(
                debounceTime(250),
                distinctUntilChanged()
            )
            .subscribe(searchText => this.runSearch(searchText));

        // Fetch new chords
        this.fetchNextNewChords();
    }

    searchTextChanged(e: Event) {
        const searchText = (e.target as HTMLInputElement).value || "";
        this.searchText.next(searchText);
    }

    async fetchNextNewChords() {
        const take = 3;
        const pagedResult = await this.chordService.getNew(this.newChordsSkip, take);
        this.newChords = pagedResult.results;
        this.newChordsSkip += take;
    }

    updateSearchQueryString(search: string) {
        if (search) {
            history.pushState({}, "", `?search=${encodeURIComponent(search)}`);
            document.title = `'${search}' search on Messianic Chords`;
        } else {
            history.pushState({}, "", "/");
            document.title = "Messianic Chords";
        }
    }

    async runSearch(query: string) {
        if (!query) {
            this.searchResults.reset();
            this.updateSearchQueryString("");
            return;
        }

        this.updateSearchQueryString(query);
        this.searchResults.reset();
        this.searchResults.fetch();
    }

    render() {
        const navClass = this.searchResults.items.length > 0 ? "d-none" : "";
        return html`
            <section class="home-page">
                <div class="search-container">
                <sl-input
                    id="search-box"
                    type="search"
                    placeholder="Type a song, artist, or lyric"
                    autofocus
                    clearable
                    pill
                    size="large"
                    value="${this.searchText.value}"
                    @input="${this.searchTextChanged}">
                </sl-input>
            </div>

            <nav class="text-center ${navClass} d-flex flex-column gap-3">

                <div class="d-flex flex-column">
                    <span>Browse</span>
                    <div class="browse-by-container d-flex gap-2 justify-content-center align-items-center">
                        <a class="fw-bold" href="/browse/newest">New</a>
                        <sl-divider vertical></sl-divider>
                        <a class="fw-bold" href="/browse/songs">Songs</a>
                        <sl-divider vertical></sl-divider>
                        <a class="fw-bold" href="/browse/artists">Artists</a>
                        <sl-divider vertical></sl-divider>
                        <a class="fw-bold" href="/browse/random">Random</a>
                    </div>
                </div>

                <div class="d-flex flex-column">
                    <div class="d-flex justify-content-center mb-1 mb-sm-0">
                        New chord charts 
                        <sl-icon-button class="load-more-chords-btn" name="arrow-clockwise" label="Scroll right" @click="${this.fetchNextNewChords}" .disabled=${this.newChords.length === 0}></sl-icon-button>
                    </div>
                    <div class="new-chords d-flex gap-2 justify-content-center align-items-center">
                        ${this.renderNewChords()}
                    </div>
                </div>

                <div class="d-flex justify-content-center">
                    <div class="me-1">Got chords to share?</div>
                    <a class="fw-bold" href="/chordsheets/new">Upload</a>
                </div>
            </nav>

            <chord-collection .chords="${this.searchResults}"></chord-collection>
      </section>`;
    }

    renderNewChords(): TemplateResult {
        if (this.newChords.length === 0) {
            return this.renderNewChordsPlaceholder();
        }

        return html`
            ${repeat(this.newChords, c => c.id, c => this.renderNewChordLink(c))}
        `;
    }

    renderNewChordsPlaceholder(): TemplateResult {
        return html`
            <div class="new-chords-placeholder-container placeholder-glow row ms-sm-2 my-1 my-sm-auto">
                <sl-skeleton effect="pulse" class="col-3"></sl-skeleton>
                <sl-skeleton effect="pulse" class="col-5"></sl-skeleton>
                <sl-skeleton effect="pulse" class="col-4"></sl-skeleton>
            </div>
        `;
    }

    renderNewChordLink(newChordSheet: ChordSheet): TemplateResult {
        const songName = [newChordSheet.song, newChordSheet.hebrewSongName]
            .filter(s => !!s)
            .join(" ");
        const title = newChordSheet.key ?
            html`${songName} - ${newChordSheet.key}` :
            html`${songName}`;
        return html`
            <a class="new-chord-link fw-bold text-truncate" href="${newChordSheet.id}">${title}</a>
            <sl-divider vertical></sl-divider>
        `;
    }
}
