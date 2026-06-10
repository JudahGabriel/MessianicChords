import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "../components/chord-collection.js";
import "../components/chord-card";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { appHomeStyles } from "./app-home.styles";
import { sharedStyles } from "../common/shared.styles";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/skeleton/skeleton.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "../components/home-jumbotron.js";
import { PagedList } from "../models/paged-list";

@customElement("app-home")
export class AppHome extends LitElement {

    static styles = [sharedStyles, appHomeStyles];

    @state() newChords: ChordSheet[] = [];
    @state() newChordsSkip = 0;
    @state() hasSearchResults = false;
    searchResults = new PagedList<ChordSheet>((skip, take) => this.chordService.searchPaged(this.searchText.value, skip, take));
    readonly chordService = new ChordService();
    readonly searchText = new BehaviorSubject("");
    readonly isInTabbedPwa = window.matchMedia("(display-mode: tabbed)").matches;

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

    render(): TemplateResult {
        const showNewChords = this.searchResults.items.length === 0;
        const target = this.isInTabbedPwa ? "_blank" : "_self";
        return html`
            <section class="home-page">
                <home-jumbotron></home-jumbotron>
                <div class="search-container">
                <wa-input
                    id="search-box"
                    type="search"
                    placeholder="Type a song, artist, or lyrics"
                    autofocus
                    autocomplete="off"
                    pill
                    size="large"
                    value="${this.searchText.value}"
                    @input="${this.searchTextChanged}"
                    @wa-clear="${this.searchTextChanged}">
                </wa-input>
            </div>

            <nav class="text-center d-flex flex-column gap-3">

                <div class="d-flex flex-column">
                    <span>Browse</span>
                    <div class="browse-by-container d-flex gap-2 justify-content-center align-items-center">
                        <a class="fw-bold" href="/browse/newest" target="${target}">New</a>
                        <wa-divider vertical></wa-divider>
                        <a class="fw-bold" href="/browse/songs" target="${target}">Songs</a>
                        <wa-divider vertical></wa-divider>
                        <a class="fw-bold" href="/browse/artists" target="${target}">Artists</a>
                        <wa-divider vertical></wa-divider>
                        <a class="fw-bold" href="/browse/tags" target="${target}">Tags</a>
                        <wa-divider vertical></wa-divider>
                        <a class="fw-bold" href="/browse/random" target="${target}">Random</a>
                        <wa-divider vertical></wa-divider>
                        <a class="fw-bold" href="/browse/offline" target="${target}">Offline</a>
                    </div>
                </div>

                ${showNewChords ? html`
                    <div class="d-flex flex-column gap-3">
                        <div class="d-flex justify-content-center">
                            New chord charts 
                            <wa-tooltip content="Load more recently uploaded chord charts" placement="top">
                                <wa-button class="load-more-chords-btn" aria-label="Scroll right" @click="${this.fetchNextNewChords}" ?disabled=${this.newChords.length === 0}>
                                    <wa-icon name="arrow-clockwise"></wa-icon>
                                </wa-button>
                            </wa-tooltip>
                        </div>
                        <div class="new-chords d-flex gap-2 justify-content-center align-items-center">
                            ${this.renderNewChords()}
                        </div>
                    </div>
                ` : null}

                <div class="d-flex justify-content-center gap-2">
                    <div>Got chords to share?</div>
                    <a class="fw-bold" href="/chordsheets/new" target="${target}">Upload</a>
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
            ${repeat(this.newChords, c => c.id, c => html`
                <chord-card .chord="${c}" ?new-window="${this.isInTabbedPwa}"></chord-card>
            `)}
        `;
    }

    renderNewChordsPlaceholder(): TemplateResult {
        return html`
            <div class="new-chords-placeholder-container" aria-hidden="true">
                <div class="new-chord-skeleton"><wa-skeleton effect="pulse"></wa-skeleton></div>
                <div class="new-chord-skeleton"><wa-skeleton effect="pulse"></wa-skeleton></div>
                <div class="new-chord-skeleton"><wa-skeleton effect="pulse"></wa-skeleton></div>
            </div>
        `;
    }

}

