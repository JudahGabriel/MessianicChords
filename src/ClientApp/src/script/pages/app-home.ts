import { html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '../components/chord-card';
import { ChordSheet } from '../models/interfaces';
import { ChordService } from '../services/chord-service';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { appHomeStyles } from './app-home.styles';
import { sharedStyles } from '../common/shared.styles';
import { bootstrapGridStyles } from '../common/bootstrap-grid.styles';
import { bootstrapUtilities } from '../common/bootstrap-utilities.styles';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

@customElement('app-home')
export class AppHome extends LitElement {

  static styles = [sharedStyles, bootstrapGridStyles, bootstrapUtilities, appHomeStyles];

  @state() newChords: ChordSheet[] = [];
  @state() isLoading = false;
  @state() searchResults: ChordSheet[] = [];
  @state() newChordsSkip = 0;
  readonly chordService = new ChordService();
  readonly searchText = new BehaviorSubject("");

  constructor() {
    super();
  }

  // Lit callback when component is attached to the DOM
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
    const searchText = (e.target! as HTMLInputElement).value;
    this.searchText.next(searchText);
  }

  async fetchNextNewChords() {
    const take = 3;
    var pagedResult = await this.chordService.getNew(this.newChordsSkip, take);
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
      this.isLoading = false;
      this.searchResults = [];
      this.updateSearchQueryString("");
      return;
    }

    this.isLoading = true;
    this.updateSearchQueryString(query);
    try {
      const results = await this.chordService.search(query);
      const isStillWaitingForResults = query === this.searchText.value;
      if (isStillWaitingForResults) {
        this.searchResults = results;
        this.isLoading = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const navClass = this.searchResults.length > 0 ? "d-none" : "";
    return html`
      <section class="home-page container">
        <div class="search-container">
          <sl-input
            id="search-box"
            type="search"
            placeholder="Type a song, artist, or partial lyric"
            autofocus
            clearable
            pill
            size="large"
            value="${this.searchText.value}"
            @input="${this.searchTextChanged}">
          </sl-input>
        </div>

        <nav class="text-center ${navClass}">
          <div class="row">
            <div class="col-6 offset-md-3">
              <div class="browse-by-container d-flex gap-1 justify-content-center align-items-center">
                <span>Browse:</span>
                <a class="fw-bold" href="/browse/newest">Newest</a>
                <sl-divider vertical></sl-divider>
                <a class="fw-bold" href="/browse/songs">By song</a>
                <sl-divider vertical></sl-divider>
                <a class="fw-bold" href="/browse/artists">By artist</a>
                <sl-divider vertical></sl-divider>
                <a class="fw-bold" href="/browse/random">Random</a>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col new-chords text-center mt-2 d-flex">
              <span>New chords:</span>
              ${this.renderNewChords()}
              <button class="btn btn-light ms-2" @click="${this.fetchNextNewChords}" .disabled=${this.newChords.length===0}>
                Load more...
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-center">
            <div class="site-text">
              Got chords to share?
              <a class="fw-bold" href="/chordsheets/new">Upload</a>
            </div>
          </div>
        </nav>

        ${this.renderLoading()}

        <div class="search-results-container w-100 d-flex flex-wrap justify-content-evenly align-items-stretch">
          ${repeat(this.searchResults, c => c.id, c => this.renderSearchResult(c))}
        </div>
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
      .join(' ');
    const title = newChordSheet.key ?
      html`${songName} - ${newChordSheet.key}` :
      html`${songName}`;
    // const separator = index != this.newChords.length - 1 ?
    //   html`<span class="bar-separator d-none d-sm-inline">&nbsp;|&nbsp;</span>` :
    //   html``;
    return html`
        <sl-button class="new-chord-link text-truncate" variant="text" href="${newChordSheet.id}">${title}</sl-button>
        <sl-divider vertical></sl-divider>
    `;
  }

  renderLoading(): TemplateResult {
    if (!this.isLoading) {
      return html``;
    }

    return html`
      <div class="loading-block">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="site-text">Searching, one moment...</span>
      </div>
    `;
  }

  renderSearchResult(chordSheet: ChordSheet): TemplateResult {
    return html`
      <chord-card .chord="${chordSheet}"></chord-card>
    `;
  }
}
