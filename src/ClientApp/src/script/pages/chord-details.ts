import { RouterLocation } from "@vaadin/router";
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

    location: RouterLocation | null = null;
    chordChartLines: ChordChartLine[] | null = null;
    readonly chordService = new ChordService();
    readonly chordCache = new ChordCache();

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
        document.title = `${chordName} chords and lyrics on Messianic Chords`;

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

    chordSheetLoadFailed(error: any) {
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
            <section class="container mx-auto">
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
                    <div class="d-flex justify-content-between align-items-center mb-sm-4">
                        <h1 class="song-name">${chord.song}</h1>
                        <span class="hebrew-song-name" lang="he">${chord.hebrewSongName}</span>
                        <h5 class="artist-author-name">
                            <a href="/artist/${encodeURIComponent(chord.artist || chord.authors[0])}">
                                ${chord.artist || chord.authors.join(", ")}
                            </a>
                        </h5>
                    </div>
                </div>
            </div>

            <!-- Song toolbar -->
            <div class="row d-print-none">
                <div class="col-12">
                    
                    <div class="btn-toolbar">
                        <sl-icon-button name="download" label="Download this chord chart" title="Download this chord chart"></sl-icon-button>
                        <sl-icon-button name="play-fill" label="Play the audio recording for this song" title="Play the audio recording for this song"></sl-icon-button>
                        <sl-button-group label="Transpose">
                            <sl-icon-button name="caret-down-fill"></sl-icon-button>
                            <sl-icon-button name="caret-up-fill"></sl-icon-button>
                        </sl-button-group>
                        <sl-icon-button name="pencil-square" label="Edit" title="Edit this chord chart"></sl-icon-button>
                        <sl-icon-button name="printer" label="Print" title="Print this chord chart"></sl-icon-button>
                        

                        <div class="btn-group" role="group" aria-label="Chord chart toolbar">
                            <a href="${this.downloadUrl(chord)}" target="_blank" download="" class="btn btn-light" title="Download" aria-label="Download">
                                <img src="/assets/bs-icons/save.svg" alt="Download">
                            </a>
                            <button type="button" class="btn btn-light" title="Print" @click="${this.print}" aria-label="Print">
                                <img src="/assets/bs-icons/printer.svg" alt="Print">
                            </button>
                            ${this.renderTransposeButtons(chord)}
                            ${this.renderPlayButton(chord)}
                            ${this.renderFullScreenButton()}
                            ${this.renderOpenInGDriveButton(chord)}
                            <a href="/${chord.id}/edit" class="btn btn-light" title="Edit chord chart" aria-label="Edit chord chart">
                                <img src="/assets/bs-icons/pencil-square.svg" alt="Edit" style="transform: translateY(2px)" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chords and sidebar -->
            <div class="row">
                <div class="col-12 col-lg-9">
                    ${this.renderChordPreviewer(chord)}
                </div>

                <!-- Sidebar -->
                <div class="sidebar col-lg-3 d-flex flex-column gap-3">
                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>General</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>

                        <p>
                            Name: <strong>${chord.song}</strong>
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
                    </sl-card>

                    <sl-card class="card-header w-100">
                        <div slot="header">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Media</span>
                                <sl-icon-button name="pencil-square" label="Edit" href="/${chord.id}/edit" title="Edit this song"></sl-icon-button>
                            </div>
                        </div>
                        <p class="d-flex gap-1 align-items-center">
                            <span class="fs-5 pe-1 ps-1" lang="he" style="color: #e9dd9a; background-color: #2f3d58">ח</span>
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
                        </ul>
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
                            Sheet music: <strong>${chord.isSheetMusic ? "✔️" : "✖️"}</strong>
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
        // Don't render Chavah, Youtube, Chordify, or Google Docs links.
        // These are handled separately.
        if (link.includes("messianicradio.com") || link.includes("youtube.com") || link.includes("chordify.net") || link.includes("docs.google.com")) {
            return html``;
        }

        const linkText = link.replace("https://", "").replace("http://", "");
        return html`
            <li>
                <a class="text-truncate d-block" href="${link}" target="_blank" rel="noopener">${linkText}</a>
            </li>
        `;
    }

    renderPlayButton(chord: ChordSheet): TemplateResult {
        const chavahLink =
            chord.links.find(url => url.startsWith("https://messianicradio.com") && url.includes("song=songs/")) ||
                (chord.chavahSongId ? `https://messianicraido.com?song=${chord.chavahSongId}` : null);
        const youtubeLink = chord.links.find(l => l.startsWith("https://youtube.com/watch?v="));
        const playLink = chavahLink || youtubeLink;
        if (!playLink) {
            return html``;
        }

        const iconName = chavahLink ? "play-circle.svg" : "youtube.svg";
        return html`
            <a href="${playLink}" target="_blank" class="btn btn-light" title="Play this song" aria-label="Play this song">
                <img src="/assets/bs-icons/${iconName}" alt="Play icon">
            </a>
        `;
    }

    renderFullScreenButton(): TemplateResult {
        if (!this.canGoFullScreen) {
            return html``;
        }

        return html`
            <button type="button" class="btn btn-light" title="View fullscreen" @click="${this.goFullscreen}" aria-label="View fullscreen">
                <img src="/assets/bs-icons/arrows-fullscreen.svg" alt="Fullscreen">
            </button>
        `;
    }

    renderOpenInGDriveButton(chord: ChordSheet): TemplateResult {
        // Do we have this thing on Google Drive?
        const address = chord.publishUri || chord.address;
        if (!address) {
            return html``;
        }

        return html`
            <a href="${address}" target="_blank" class="btn btn-light" title="Open on Google Drive" aria-label="Open on Google Drive">
                <img src="/assets/bs-icons/box-arrow-up-right.svg" alt="Open">
            </a>
        `;
    }

    renderTransposeButtons(chord: ChordSheet): TemplateResult {
        // We can only do this for plain text chord sheets.
        if (!chord.chords) {
            return html``;
        }

        const positiveTransposeClass = this.transpose > 0 ? "d-inline" : "d-none";
        const negativeTransposeClass = this.transpose < 0 ? "d-inline" : "d-none";
        return html`
            <button type="button" class="btn btn-light transpose-btn" title="Transpose down a half-step" aria-label="Transpose down a half-step" @click="${() => this.bumpTranspose(-1)}">
                <img src="/assets/bs-icons/dash.svg" alt="-" />
                <span class="text-muted ${negativeTransposeClass}">${this.transpose}</span>
            </button>
            <button type="button" class="btn btn-light transpose-btn" title="Transpose up a half-step" aria-label="Transpose down a half-step" @click="${() => this.bumpTranspose(1)}">
                <img src="/assets/bs-icons/plus.svg" alt="+" />
                <span class="text-muted ${positiveTransposeClass}">${this.transpose}</span>
            </button>
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
        // <p class="plain-text-preview">${chord.chords}</p>
        return html`
            <p class="plain-text-preview">${repeat(lines, l => lines.indexOf(l), l => this.renderPlainTextLine(l))}</p>
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
        const imgPreview = this.shadowRoot?.querySelector("img-preview");
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
    }
}