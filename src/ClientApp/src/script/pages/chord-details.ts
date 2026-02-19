import { Router, RouterLocation } from "@vaadin/router";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { repeat } from "lit/directives/repeat.js";
import { ChordCache } from "../services/chord-cache";
import { ChordChartLine, ChordChartSpan, createChordChartLines } from "../models/chord-chart-line";
import { Chord } from "../models/chord";
import { chordDetailStyles } from "./chord-details.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";
import { bootstrapGridStyles } from "../common/bootstrap-grid.styles";
import { sharedStyles } from "../common/shared.styles";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/button-group/button-group.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/details/details.js";
import "@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js";
import "@shoelace-style/shoelace/dist/components/tab/tab.js";
import "@shoelace-style/shoelace/dist/components/tab-group/tab-group.js";

@customElement("chord-details")
export class ChordDetails extends LitElement {
    static get styles() {
        return [sharedStyles, bootstrapGridStyles, bootstrapUtilities, chordDetailStyles];
    }

    @state() chord: ChordSheet | null = null;
    @state() error: string | null = null;
    @state() canGoFullScreen: boolean | null = null;
    @state() isWebPublished = false;
    @state() hasScreenshots = false;
    @state() transpose = 0;
    @state() fontSize = ChordDetails.defaultFontSize;

    location: RouterLocation | null = null;
    chordChartLines: ChordChartLine[] | null = null;
    readonly chordService = new ChordService();
    readonly chordCache = new ChordCache();
    static readonly defaultFontSize = 16;

    connectedCallback(): void {
        super.connectedCallback();

        // See if we have a transpose hash in the address bar, e.g. "#transpose=4"
        if (window.location.hash) {
            const match = window.location.hash.match(/^#transpose=(-?\d{1,2})$/);
            if (match) {
                const transposeVal = parseInt(match[1], 10);
                if (!isNaN(transposeVal) && transposeVal >= -12 && transposeVal <= 12) {
                    this.transpose = transposeVal;
                }
            }
        }
    }

    firstUpdated() {
        this.canGoFullScreen = !!document.body.requestFullscreen;
        this.loadChordSheet()
            .then(result => this.chordSheetLoaded(result))
            .catch(error => this.chordSheetLoadFailed(error));
    }

    chordSheetLoaded(chord: ChordSheet) {
        if (!chord) {
            this.chordSheetLoadFailed("Unable to load chord sheet. API return null for " + this.location?.params["id"]);
            return;
        }

        this.chord = chord;
        this.isWebPublished = !!chord.publishUri;
        this.hasScreenshots = chord.screenshots.length > 0;
        this.cacheChordForOfflineSearch(chord);
        const chordName = [
            chord.song,
            chord.hebrewSongName
        ]
            .filter(n => !!n)
            .join(" ");
        document.title = `${chordName} by ${chord.artist || chord.authors[0] || "Unknown"} - guitar chord chart and lyrics - MessianicChords.com`;

        // Offline helper: see if we have a offline index query string.
        // If so, fetch the next chord sheet in the list and load that in a moment.
        const queryParams = new URLSearchParams(this.location?.search || "");
        const offlineIndexStr = queryParams.get("offline-index") || "";
        const offlineIndex = parseFloat(offlineIndexStr);
        if (offlineIndex >= 0) {
            setTimeout(() => {
                this.chordService.getByOrderedIndex(offlineIndex)
                    .then(chordId => {
                        if (chordId) {
                            window.location.href = `/${chordId}?offline-index=${offlineIndex+1}`;
                        }
                    });

            }, 3000);
        }
    }

    chordSheetLoadFailed(error: unknown) {
        // Couldn't load the chord sheet from the network? See if it's in our local cache.
        const chordId = this.location?.params["id"] as string;
        if (!chordId) {
            this.error = "Couldn't load chord from local cache because we couldn't find an chord ID in the URL.";
            return;
        }

        // If the chord sheet is in the cache, cool, let's just use that.
        this.chordCache.get(chordId)
            .then(chord => chord ? this.chordSheetLoaded(chord) : this.error = `Unable to load chord from API and from cache: ${error}`)
            .catch(cacheError => this.error = `Unable to load chord from API due to error ${error}. Failed to load from cache due to cache error: ${cacheError}`);
    }

    render(): TemplateResult {
        let content: TemplateResult;
        if (this.error) {
            content = this.renderError();
        } else if (!this.chord) {
            content = this.renderLoading();
        } else {
            content = this.renderChordDetails(this.chord);
        }

        return html`
            <section class="container">
                <div>
                    ${content}
                </div>
            </section>
            ${this.renderPrintableScreenshots()}
        `;
    }

    renderPrintableScreenshots(): TemplateResult {
        // If the chord chart is not in the new plain text format and we have screenshots, render them but hidden.
        // This accomplishes 2 purposes:
        //  1. Fetches the screenshots, making them available offline and enabling offline rendering of this page.
        //  2. Makes printing easier. Printing iframes is fraught with issues. Printing images isn't.
        if (!this.chord || !this.hasScreenshots || !!this.chord.chords) {
            return html``;
        }

        return html`
            <div class="printable-screenshots">
                ${this.renderScreenshots(this.chord)}
            </div>
        `;
    }

    renderLoading(): TemplateResult {
        return html`
            <div class="gx-2 row loading-name-artist">
                <div class="placeholder-glow col-6 col-sm-4 offset-sm-2">
                    <span class="placeholder w-100 d-inline-block"></span>
                </div>
                <div class="placeholder-glow col-6 col-sm-4">
                    <span class="placeholder w-100 d-inline-block"></span>
                </div>
            </div>

            <div class="iframe-loading-placeholder mx-auto">
                <div class="w-100 h-100"></div>
            </div>
        `;
    }

    renderError(): TemplateResult {
        return html`
            <div class="alert alert-warning d-inline-block mx-auto" role="alert">
                Woops, we hit a problem loading this chord chart.
                <a href="${window.location.href}" class="alert-link">
                    Try again
                </a>
                <hr>
                <p class="mb-0">
                    Additional error details: ${this.error}
                </p>
            </div>
        `;
    }

    renderChordDetails(chord: ChordSheet): TemplateResult {
        // For printing, we have special handling for the header (title and author).
        // - If the chord chart is in the new format, include the header in the print.
        // - If the chord chart isn't in the new format, don't include the header in the print.
        const headerClass = chord.chords ? "" : "d-print-none";        
        return html`
            <!-- Song details -->
            <div class="row ${headerClass}">
                <div class="col-12 col-lg-12">
                    <div class="song-artist-and-title-container d-flex justify-content-between align-items-baseline mb-sm-4">
                        <h1 class="song-name">${chord.song} <span class="hebrew-song-name" lang="he">${chord.hebrewSongName}</span></h1>
                        <h5 class="artist-author-name">
                            <a href="/artist/${encodeURIComponent(chord.artist || chord.authors[0])}">
                                ${chord.artist || chord.authors.join(", ")}
                            </a>
                        </h5>
                    </div>
                </div>
            </div>

            <!-- Song toolbar -->
            ${this.renderSongToolbar(chord)}

            <div class="row">
                <!-- Chord chart -->
                <div class="col-12 col-lg-8 chord-chart">
                    ${this.renderChordPreviewer(chord)}
                </div>

                <!-- Sidebar -->
                <div class="sidebar col-lg-4 d-flex flex-column gap-5 d-print-none">
                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>General</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>

                        <p>
                            Name: <strong class="text-right">${chord.song}</strong>
                        </p>
                        <p>
                            Hebrew name: <strong>${chord.hebrewSongName}</strong>
                        </p>
                        <p>
                            Artist: <strong>${chord.artist}</strong>
                        </p>
                        <p>
                            Authors: <strong>${chord.authors.join(", ")}</strong>
                        </p>
                        <p>
                            Tags: <strong>${chord.tags.join(", ")}</strong>
                        </p>
                    </sl-card>

                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Media</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>

                        ${this.renderAudioPlayer(chord)}
                        <ul class="media-links">
                            ${repeat(chord.links, l => l, l => this.renderLink(l))}
                        </ul>

                        <!-- <p class="d-flex gap-1 align-items-center">
                            <span class="fs-5 pe-2 ps-2" lang="he" style="color: #e9dd9a; background-color: #2f3d58">ח</span>
                            Chavah: 
                            ${this.renderChavahLink(chord)}
                        </p>
                        <p class="d-flex gap-1 align-items-center">
                            <sl-icon name="youtube" label="Youtube" style="color: red !important;"></sl-icon>
                            Youtube: 
                            ${this.renderYoutubeLink(chord)}
                        </p>
                        <p class="d-flex gap-1 align-items-center">
                            <sl-icon name="music-note-list" label="Chordify" style="color: #0a8282"></sl-icon>
                            <span>Chordify:</span> 
                             ${this.renderChordifyLink(chord)}
                        </p>
                        <p class="d-flex gap-1 align-items-center">
                            <sl-icon name="file-earmark-text" label="Google Docs" style="color: #387FF5"></sl-icon>
                            <span>Google Docs:</span> 
                             ${this.renderGoogleDocsLink(chord)}
                        </p>
                        <p>
                            Other links:
                        </p>
                        <ul>
                            ${repeat(chord.links, l => l, l => this.renderLink(l))}
                        </ul> -->
                    </sl-card>

                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Arrangement</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>
                        <p>
                            Key: <strong>${chord.key}</strong>
                        </p>
                        <p>
                            Capo: <strong>${chord.capo}</strong>
                        </p>
                        <p>
                            Type: <strong>${chord.isSheetMusic ? "Sheet music" : "Chord chart"}</strong>
                        </p>
                        <p>
                            About:
                        </p>
                        <blockquote>${chord.about}</blockquote>
                    </sl-card>

                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Copyright</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>
                        <p>
                            Copyright: <strong>${chord.copyright} ${chord.year}</strong>
                        </p>
                        <p>
                            CCLI: <strong>${chord.ccliNumber}</strong>
                        </p>
                    </sl-card>
                </div>
            </div>
            <p style="display: none">
                ${chord.plainTextContents}
            </p>
        `;
    }

    renderSongToolbar(chord: ChordSheet): TemplateResult {
        const transposeUpTooltip = chord.chords ? "Transpose the chords up a half-step" : "Transposing is disabled for this chord chart because it's in an unsupported format.";
        const transposeDownTooltip = chord.chords ? "Transpose the chords down a half-step" : "Transposing is disabled for this chord chart because it's in an unsupported format.";
        const btnSize = matchMedia("(max-width: 575px)").matches ? "small" : "medium";
        const fontSizeClass = chord.chords ? "" : "d-none";
        return html`
            <div class="row d-print-none">
                <div class="col-12">
                    <div class="btn-toolbar">
                        <sl-button-group>

                            <sl-tooltip content="Play the audio recording for this song" hoist>
                                <sl-button size="${btnSize}" @click="${this.playMedia}">
                                    <sl-icon name="play-fill"></sl-icon>
                                </sl-button>
                            </sl-tooltip>

                            <sl-tooltip content="Download this chord chart" hoist>
                                <sl-button size="${btnSize}" href="${this.downloadUrl(chord)}" download="${chord.artist} - ${chord.song}.html">
                                    <sl-icon name="download"></sl-icon>
                                </sl-button>
                            </sl-tooltip>

                            <sl-tooltip content="View fullscreen" hoist>
                                <sl-button size="${btnSize}" @click="${this.goFullscreen}">
                                    <sl-icon name="fullscreen"></sl-icon>
                                </sl-button>
                            </sl-tooltip>

                        </sl-button-group>

                        <sl-button-group>
                            <sl-tooltip content="Print this chord chart" hoist>
                                <sl-button size="${btnSize}" @click="${this.print}">
                                    <sl-icon name="printer"></sl-icon>
                                </sl-button>
                            </sl-tooltip>

                            <sl-tooltip content="Edit this chord chart" hoist>
                                <sl-button size="${btnSize}" href="/${chord.id}/edit" target="_blank">
                                    <sl-icon name="pencil-square"></sl-icon>
                                </sl-button>
                            </sl-tooltip>
                        </sl-button-group>
                        
                        <sl-button-group label="Transpose">
                            <sl-tooltip content="${transposeUpTooltip}" hoist>
                                <sl-button size="${btnSize}" @click="${() => this.bumpTranspose(1)}" ?disabled="${!this.chord?.chords}">
                                    <sl-icon name="caret-up-fill"></sl-icon>
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Chord transposition" hoist>
                                <sl-button class="transpose-value" disabled size="${btnSize}" @click="${() => this.bumpTranspose(-1)}">
                                    ${this.transpose > 0 ? "+" + this.transpose : this.transpose}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="${transposeDownTooltip}" hoist>
                                <sl-button size="${btnSize}" @click="${() => this.bumpTranspose(-1)}" ?disabled="${!this.chord?.chords}">
                                    <sl-icon name="caret-down-fill"></sl-icon>
                                </sl-button>
                            </sl-tooltip>
                        </sl-button-group>
                        
                        <sl-button-group class="${fontSizeClass}" label="Font Size">
                            <sl-tooltip content="Increase font size" hoist>
                                <sl-button size="${btnSize}" @click="${() => this.changeFontSize(2)}">
                                    <strong>A</strong> <sl-icon name="caret-up-fill"></sl-icon>
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Current font size" hoist>
                                <sl-button disabled size="${btnSize}">
                                    ${this.fontSize}px
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Decrease font size" hoist>
                                <sl-button size="${btnSize}" @click="${() => this.changeFontSize(-2)}">
                                    <small font-size="0.85em">A <sl-icon name="caret-down-fill"></sl-icon></small> 
                                </sl-button>
                            </sl-tooltip>
                        </sl-button-group>

                    </div>
                    
                </div>
            </div>
        `;
    }

    renderChavahLink(chord: ChordSheet): TemplateResult {
        const chavahLink =
            chord.links.find(url => url.startsWith("https://messianicradio.com") && url.includes("song=songs/")) ||
                (chord.chavahSongId ? `https://messianicraido.com?song=${chord.chavahSongId}` : null);
        if (!chavahLink) {
            return html``;
        }

        return html`
            <a href="${chavahLink}" target="_blank">Play this song on Chavah</a>
        `;
    }

    renderYoutubeLink(chord: ChordSheet): TemplateResult {
        const youtubeLink = chord.links.find(l => l.startsWith("https://youtube.com/watch?v="));
        if (!youtubeLink) {
            return html``;
        }

        return html`
            <a href="${youtubeLink}" target="_blank">Watch this song on Youtube</a>
        `;
    }

    renderChordifyLink(chord: ChordSheet): TemplateResult {
        const chordifyLink = chord.links.find(l => l.startsWith("https://chordify.net/chords/"));
        if (!chordifyLink) {
            return html``;
        }

        return html`
            <a class="d-flex align-items-center" href="${chordifyLink}" target="_blank" title="Open the Chordify arrangement of this song">
                Open Chordify arrangement
            </a>
        `;
    }

    renderGoogleDocsLink(chord: ChordSheet): TemplateResult {
        const gDocPublishedLink = chord.links.find(l => l.startsWith("https://docs.google.com/") && l.endsWith("/pub"));
        const gDocLink = gDocPublishedLink || chord.links.find(l => l.startsWith("https://docs.google.com"));
        if (!gDocLink) {
            return html``;
        }

        return html`
            <a class="d-flex align-items-center" href="${gDocLink}" target="_blank">
                Open on Google Docs
            </a>
        `;
    }

    renderLink(link: string): TemplateResult {
        const linkText = link.replace("https://", "").replace("http://", "");
        return html`
            <li>
                <a class="text-truncate d-block" href="${link}" target="_blank" rel="noopener">
                    ${linkText}
                </a>
            </li>
        `;
    }

    renderChordPreviewer(chord: ChordSheet): TemplateResult {
        // Best case scenario: Do we have plain text chords? Cool, use those.
        if (chord.chords) {
            return this.renderPlainTextPreviewer(chord);
        }

        // If we're not online, see if we can render the offline previewer (i.e. the screenshots of the doc)
        // This is needed because we can't load iframes of other domains (Google Docs) while offline, even with service worker caching.
        let previewer: TemplateResult;
        if (!navigator.onLine) {
            previewer = this.renderOfflinePreviewer(chord);
        } else {
            switch (chord.extension) {
                case "gif":
                case "jpg":
                case "jpeg":
                case "tiff":
                case "png":
                    previewer = this.hasScreenshots ? this.renderScreenshots(chord) : this.renderImagePreviewer(this.downloadUrl(chord));
                    break;
                case "pdf":
                    // Do we have a screenshot of the doc? Use that. PDF preview is quite buggy and heavyweight.
                    previewer = this.hasScreenshots ? this.renderScreenshots(chord) : this.renderGDocPreviewer(chord);
                    break;
                default:
                    previewer = this.renderGDocPreviewer(chord);
            }
        }

        // If we have screenshots, we'll use those for printing and hide the previewer during print.
        if (this.hasScreenshots) {
            return html`
                <div class="d-print-none">
                    ${previewer}
                </div>
            `;
        }

        return previewer;
    }

    renderPlainTextPreviewer(chord: ChordSheet): TemplateResult {
        const lines = this.getChordChartLines(chord);
        return html`
            <p class="plain-text-preview" style="font-size: ${this.fontSize}px;">${repeat(lines, l => lines.indexOf(l), l => this.renderPlainTextLine(l))}</p>
        `;
    }

    renderPlainTextLine(line: ChordChartLine): TemplateResult {
        if (line.type === "lyrics") {
            return this.renderPlainTextLyricLine(line);
        }

        return this.renderPlainTextChordLine(line);
    }

    renderPlainTextLyricLine(chordLine: ChordChartLine): TemplateResult {
        return html`<span>${chordLine.spans[0].value}</span>\n`;
    }

    renderPlainTextChordLine(chordLine: ChordChartLine): TemplateResult {
        return html`${repeat(chordLine.spans, i => chordLine.spans.indexOf(i), s => this.renderPlainTextSpan(s))}\n`;
    }

    renderPlainTextLyricSpan(span: ChordChartSpan) {
        return html`<span>${span.value}</span>`;
    }

    renderPlainTextSpan(span: ChordChartSpan): TemplateResult {
        if (span.type === "other") {
            return this.renderPlainTextLyricSpan(span);
        }

        const chord = Chord.tryParse(span.value);
        if (!chord) {
            return this.renderPlainTextLyricSpan(span);
        }

        const chordStartIndex = span.value.indexOf(chord.fullName);
        const chordEndIndex = chordStartIndex + chord.fullName.length;
        const whitespaceStart = chordStartIndex > 0 ? span.value.slice(0, chordStartIndex) : "";
        const whitespaceEnd = span.value.slice(chordEndIndex);
        const transposedChord = chord.transpose(this.transpose);
        return html`<span>${whitespaceStart}</span><span class="chord">${transposedChord.fullName}</span><span>${whitespaceEnd}</span>`;
    }

    renderGDocPreviewer(chord: ChordSheet): TemplateResult {
        return html`
            <iframe class="${this.iframeClass}" src="${this.iframeUrl}" title="${chord.artist}" allowfullscreen zooming="true"
                frameborder="0"></iframe>
        `;
    }

    renderImagePreviewer(imgSrc: string): TemplateResult {
        return html`
            <div class="img-preview">
                <img class="img-fluid" src="${imgSrc}" />
            </div>
        `;
    }

    renderScreenshots(chord: ChordSheet): TemplateResult {
        return html`
            <div class="d-flex flex-column">
                ${repeat(chord.screenshots, k => k, i => this.renderImagePreviewer(i))}
            </div>
        `;
    }

    renderOfflinePreviewer(chord: ChordSheet): TemplateResult {
        if (chord.screenshots.length === 0) {
            return html`
                <div class="alert alert-warning d-inline-block mx-auto" role="alert">
                    ⚠ This chord sheet is not available offline.
                    <p class="mb-0">
                        ℹ️ To make this chord chart available offline, first view it while you're online.
                    </p>
                </div>
            `;
        }

        return this.renderScreenshots(chord);
    }

    loadChordSheet(): Promise<ChordSheet> {
        // Grab the chord sheet id
        const chordId = `ChordSheets/${this.location?.params["id"]}`;
        return this.chordService.getById(chordId);
    }

    get iframeUrl(): string {
        if (!this.chord) {
            return "";
        }

        if (this.chord.publishUri) {
            return `${this.chord.publishUri}?embedded=true`;
        }

        // TODO: Consider migrating away from this buggy thing and move towards Adobe's free PDF previewer.
        // See https://developer.adobe.com/document-services/apis/pdf-embed/
        if (this.chord.extension === "pdf") {
            return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(this.downloadUrl(this.chord))}`;
        }

        return `https://docs.google.com/document/d/${this.chord.googleDocId}/preview?resourcekey=${this.chord.googleDocResourceKey}`;
    }

    get pageClass(): string {
        if (!this.chord) {
            return "";
        }

        if (this.chord.pagesCount === 0 || this.chord.pagesCount === 1) {
            return "one-page";
        }

        if (this.chord.pagesCount === 2) {
            return "two-page";
        }

        return "three-page";
    }

    get iframeClass(): string {
        if (this.isWebPublished) {
            return this.pageClass + " web-published-doc";
        }

        return this.pageClass;
    }

    cacheChordForOfflineSearch(chord: ChordSheet) {
        this.chordCache.add(chord)
            .catch(cacheError => console.warn("Unable to add chord sheet to offline chord cache due to an error", cacheError));
    }

    print() {
        window.print();
    }

    downloadUrl(chord: ChordSheet): string {
        return this.chordService.downloadUrlFor(chord);
    }

    goFullscreen() {
        const plainTextPreview = this.shadowRoot?.querySelector(".plain-text-preview");
        const imgPreview = this.shadowRoot?.querySelector(".img-preview");
        const iframe = this.shadowRoot?.querySelector("iframe");
        (plainTextPreview || imgPreview || iframe)?.requestFullscreen();
    }

    getChordChartLines(chord: ChordSheet): ChordChartLine[] {
        if (!this.chordChartLines) {
            this.chordChartLines = createChordChartLines(chord.chords);
        }

        return this.chordChartLines;
    }

    bumpTranspose(increment: 1 | -1) {
        this.transpose += increment;

        // 12 half-steps in the musical scale (A, Bb, B, C, C#, D, D#, E, E#, F, F#, G)
        // If we go outside the scale, wrap to the other side.
        if (this.transpose === 12 || this.transpose === -12) {
            this.transpose = 0;
        }

        if (this.transpose !== 0) {
            window.location.hash = `#transpose=${this.transpose}`;
        } else {
            window.location.hash = "";
        }
    }

    renderAudioPlayer(chord: ChordSheet): TemplateResult {
        const chavahLink = chord.links.find(l => l.startsWith("https://messianicradio.com") && l.includes("song=songs/"));
        if (!chavahLink) {
            return html``;
        }

        const chavahUri = new URL(chavahLink);
        const chavahSongId = chavahUri.searchParams.get("song");
        if (!chavahSongId) {
            return html``;
        }

        return html`<audio controls preload="none" src="https://messianicradio.com/api/songs/getmp3byid?songId=${chavahSongId}"></audio>`;
    }

    playMedia(): void {
        const audio = this.shadowRoot?.querySelector("audio");
        if (audio) {
            audio.play();
        }
    }

    changeFontSize(amount: number) {
        const newSize = Math.max(6, Math.min(48, this.fontSize + amount));
        this.fontSize = newSize;
        this.requestUpdate();
    }
}