import { RouterLocation } from "@vaadin/router";
import { css, html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { BootstrapBase } from "../common/bootstrap-base";
import { SizeMax } from "../common/constants";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { repeat } from 'lit/directives/repeat.js';
import { ChordCache } from "../services/chord-cache";
import { ChordChartLine } from "../models/chord-chart-line";

@customElement('chord-details')
export class ChordDetails extends BootstrapBase {
    static get styles() {
        const localStyles = css`
            :host {
                --iframe-width: 876px;
                --iframe-page-height: 1100px;
                --soft-gray: rgb(248, 248, 248);
            }

            .song-name {
                font-family: var(--title-font);
                font-size: 1.8em;
                margin-bottom: -15px;
            }

            @media (max-width: ${SizeMax.Md}px) {
                .song-name {
                    font-size: 1.3em;
                    margin-bottom: -5px;
                }
            }

            .song-name,
            .hebrew-song-name {
                font-weight: bold;
                color: var(--theme-color);
            }

            .hebrew-song-name {
                font-family: "David", var(--title-font);
                font-size: 2.5em;
                direction: rtl;
            }

            @media (max-width: ${SizeMax.Md}px) {
                .hebrew-song-name {
                    font-size: 1.5em;
                }
            }

            .artist-name {
                justify-self: end;
                transform: rotateZ(-1deg);
            }

            .artist-name a {
                font-family: var(--title-font);
                text-decoration: none;
                color: var(--theme-color);
                border-radius: var(--highlight-border-radius);
                background: var(--highlight-background);
                box-shadow: var(--highlight-box-shadow);
                padding: 3px 10px;
                font-size: 0.9em;
            }

            @media (max-width: ${SizeMax.Md}px) {
                .artist-name a {
                    padding: 2px 6px;
                    font-size: 0.8em;
                }
            }

            .artist-name a:hover {
                color: brown;
            }

            .btn-toolbar {
                margin-bottom: -40px;
                transform: translateX(0) translateY(13px);
                justify-content: end;
            }

            @media (max-width: ${SizeMax.Md}px) {
                .btn-toolbar {
                    margin-bottom: 13px;
                    margin-left: -2px;
                    justify-content: start;
                }
            }

            .btn-toolbar img {
                width: 22px;
                height: 22px;
            }

            .btn-toolbar .transpose-btn {
                position: relative;
            }

            .btn-toolbar .transpose-btn span {
                position: absolute;
                top: 0;
                right: 0;
            }

            iframe {
                width: 100%;
            }

            @media (max-width: ${SizeMax.Md}px) {
                /* On phones and tablets, we show the iframe in full width but scaled down. User can scale in as necessary */
                iframe {
                    width: var(--iframe-width);
                    transform: scale(0.8); /* on tablets, scale 0.8 */
                    transform-origin: 0 0;
                    box-shadow: -5px 0 2px var(--soft-gray), 5px 0 2px var(--soft-gray);
                }
            }

            @media (max-width: ${SizeMax.Sm}px) {
                iframe {
                    transform: scale(0.6); /* on small tablets or phones in landscape orientation, scall a bit smaller */
                }
            }

            @media (max-width: ${SizeMax.Xs}px) {
                iframe {
                    transform: scale(0.34); /** on phones, scale smaller still */
                }
            }

            @media print {
                iframe {
                    /* transform: scale(1.4) translateX(-110px) translateY(-50px);
                    transform-origin: 0 0; */
                    box-shadow: none;
                    border: none;
                    width: var(--iframe-width);
                }
            }

            .site-text {
                font-size: 0.4em;
                font-family: var(--subtitle-font);
            }

            iframe.one-page {
                height: var(--iframe-page-height);
            }

            iframe.two-page {
                height: calc(2 * var(--iframe-page-height));
            }

            iframe.three-page {
                height: calc(3 * var(--iframe-page-height));
            }

            .loading-name-artist {
                margin-bottom: 20px;
            }

            .placeholder {
                height: 30px;
            }

            .iframe-loading-placeholder {
                background-color: var(--soft-gray);
                height: calc(var(--iframe-page-height) / 2);
                width: var(--iframe-width);
            }

            @media(max-width: ${SizeMax.Xs}px) {
                .iframe-loading-placeholder {
                    width: 100%;
                }
            }

            /* Google Docs published to the web have no document border. We'll add one, otherwise it's kinda weird looking. */
            .web-published-doc,
            .img-preview,
            .plain-text-preview
            {
                box-shadow: 0 0 3px 0px silver;
                margin-top: 13px;
            }

            .plain-text-preview {
                white-space: pre;
                text-align: left;
                padding: 0.5in;
                min-height: 9in;
                font-size: 16px;
                font-family: monospace;
                overflow: auto;
                background-color: white;
            }

            .plain-text-preview .chord {
                background-color: #e9ecef;
                font-weight: bold;
                box-shadow: #e9ecef 0px 0px 15px 2px;
            }

            @media print {
                .web-published-doc,
                .img-preview,
                .plain-text-preview {
                    box-shadow: none;
                    width: var(--iframe-width);
                }

                .img-preview {
                    min-height: 11in; // Standard page size for PDF and Word docs
                }
            }

            /* We don't display printable screenshots. They're just used for printing. */
            .printable-screenshots {
                display: none;
            }

            @media print {
                .printable-screenshots {
                    display: block;
                }
            }
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    @state() chord: ChordSheet | null = null;
    @state() error: string | null = null;
    @state() canGoFullScreen: boolean | null = null;
    @state() isWebPublished = false;
    @state() hasScreenshots = false;
    @state() transpose: number = 0;

    location: RouterLocation | null = null;
    chordLines: ChordChartLine[] | null = null;
    readonly chordService = new ChordService();
    readonly chordCache = new ChordCache();
    readonly majorScaleNotes = ["A", "B", "C", "D", "E", "F", "G"];
    readonly majorScaleFlatSteps = ["Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G"];
    readonly minorScaleFlatSteps = this.majorScaleFlatSteps.map(s => s + "m");
    readonly majorScaleSharpSteps = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    readonly minorScaleSharpSteps = this.majorScaleSharpSteps.map(s => s + "m");

    constructor() {
        super();
    }

    firstUpdated() {
        this.canGoFullScreen = !!document.body.requestFullscreen;
        this.loadChordSheet()
            .then(result => this.chordSheetLoaded(result))
            .catch(error => this.chordSheetLoadFailed(error));
    }

    chordSheetLoaded(chord: ChordSheet) {
        if (chord == null) {
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
                    })

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
            <section class="chord-details-page container mx-auto">
                <div class="text-center">
                    ${content}
                </div>
            </section>
            ${this.renderPrintableScreenshots()}
        `;
    }

    renderPrintableScreenshots(): TemplateResult {
        // If we have screenshots, render them but hidden.
        // This accomplishes 2 purposes:
        //  1. Fetches the screenshots, making them available offline and enabling offline rendering of this page.
        //  2. Makes printing easier. Printing iframes is fraught with issues. Printing images isn't.
        if (!this.chord || !this.hasScreenshots) {
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
        return html`
            <!-- Song details -->
            <div class="row d-print-none">
                <div class="col-12 col-lg-8 offset-lg-2">
                    <div class="d-flex justify-content-between align-items-center mb-sm-4">
                        <h1 class="song-name">${chord.song}</h1>
                        <span class="hebrew-song-name" lang="he">${chord.hebrewSongName}</span>
                        <h5 class="artist-name">
                            <a href="/artist/${encodeURIComponent(chord.artist)}">
                                ${chord.artist}
                            </a>
                        </h5>
                    </div>
                </div>
            </div>

            <!-- Song details -->
            <div class="row d-print-none">
                <div class="col-12 col-lg-8 offset-lg-2">
                    <div class="btn-toolbar">
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

            <div class="row">
                <div class="col-12 col-lg-8 offset-lg-2">
                    ${this.renderChordPreviewer(chord)}
                </div>
            </div>
            <p style="display: none">
                ${chord.plainTextContents}
            </p>
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
                    previewer = this.renderImagePreviewer(this.downloadUrl(chord));
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
        const lines = this.linefyChords(chord);
        // <p class="plain-text-preview">${chord.chords}</p>
        return html`
            <p class="plain-text-preview">${repeat(lines, l => lines.indexOf(l), l => this.renderPlainTextLine(l))}</p>
        `;
    }

    renderPlainTextLine(line: ChordChartLine): TemplateResult {
        if (line.type === "lyrics") {
            return this.renderPlainTextLyricLine(line.spans[0]);
        }

        return this.renderPlainTextChordLine(line);
    }

    renderPlainTextLyricLine(line: string): TemplateResult {
        return html`<span>${line}</span>\n`;
    }

    renderPlainTextChordLine(chordLine: ChordChartLine): TemplateResult {
        return html`${repeat(chordLine.spans, i => chordLine.spans.indexOf(i), s => this.renderPlainTextChordSpan(s))}\n`;
    }

    renderPlainTextChordSpan(span: string): TemplateResult {
        const chord = span.trim();
        if (chord.length === 0) {
            return this.renderPlainTextLyricLine(chord);
        }

        const chordStartIndex = span.indexOf(chord);
        const chordEndIndex = chordStartIndex + chord.length;
        const whitespaceStart = chordStartIndex > 0 ? span.slice(0, chordStartIndex) : "";
        const whitespaceEnd = span.slice(chordEndIndex);
        return html`<span>${whitespaceStart}</span><span class="chord">${this.transposeChord(chord, this.transpose)}</span><span>${whitespaceEnd}</span>`;
    }

    transposeChord(chord: string, halfSteps: number): string {
        // If we're at zero, there's nothing to transpose.
        if (halfSteps === 0) {
            return chord;
        }

        // Punt if it doesn't look like a legit chord.
        if (!this.majorScaleNotes.includes(chord[0])) {
            return chord;
        }

        const isFlat = chord[1] === "b";
        const isSharp = chord[1] === "#";
        const isMinor = chord[1] === "m" || ((isFlat || isSharp) && chord[2] === "m");
        const chordNoVariants = chord[0] + (isSharp ? "#" : "") + (isFlat ? "b" : "") + (isMinor ? "m" : "");
        const chordVariants = chord.slice(chordNoVariants.length);

        // Scale steps: we'll use one of these to determine the next half step.
        const desiredScale = [
            this.majorScaleFlatSteps,
            this.minorScaleFlatSteps,
            this.majorScaleSharpSteps,
            this.minorScaleSharpSteps
        ].find(stepCollection => stepCollection.includes(chordNoVariants));
        if (!desiredScale) {
            console.warn("Couldn't transpose chord. This might mean the chord is not actually a legit chord.", chord);
            return chord;
        }
        const scaleIndex = desiredScale.indexOf(chordNoVariants);

        let nextIndex = scaleIndex;
        for (let i = 0; i < Math.abs(halfSteps); i++) {
            nextIndex += (halfSteps > 0 ? 1 : -1);

            // Scale wrap-around:
            // If we were at zero and went to -1, we want to go to the end of the array (e.g. "A" -> "G")
            // Similarly, if we were at the end of the array and went beyond it, go to the beginning (e.g. "G" -> "A")
            if (nextIndex === -1) {
                nextIndex = desiredScale.length - 1;
            } else if (nextIndex === desiredScale.length) {
                nextIndex = 0;
            }
        }

        return desiredScale[nextIndex] + chordVariants;
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
        if (chord.screenshots.length == 0) {
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

    // Turns the plain text chords into an array of ChordChartLine
    linefyChords(chord: ChordSheet): ChordChartLine[] {
        if (!chord.chords) {
            return [];
        }

        if (!this.chordLines) {
            this.chordLines = [];
            const lines = chord.chords.split("\n");
            const chordRegex = new RegExp(/\s*[A-G]+[b#m(sus)(dim)(add)245679(11)(13)\s$]+/g); // Optional whitespace, Chords A through G at least once, followed by a flat (b), sharp (#), minor (m), sustained (sus), diminished (dim), add (add), 4, 5, 6, 7, 9, 11, or 13 or EOL
            for (const line of lines) {
                const chordMatches = line.match(chordRegex);
                if (!chordMatches) {
                    // It's a lyric line.
                    this.chordLines.push({ type: "lyrics", "spans": [line] });
                } else {
                    this.chordLines.push({
                        type: "chords",
                        spans: chordMatches
                    });
                }
            }
        }

        return this.chordLines;
    }

    bumpTranspose(increment: 1 | -1) {
        this.transpose += increment;

        // 12 half-steps in the musical scale (A, Bb, B, C, C#, D, D#, E, E#, F, F#, G)
        // If we go outside the scale, wrap to the other side.
        if (this.transpose === 12 || this.transpose === -12) {
            this.transpose = 0;
        }
    }

    cacheChordForOfflineSearch(chord: ChordSheet) {
        this.chordCache.add(chord)
            .catch(cacheError => console.warn("Unable to add chord sheet to offline chord cache due to an error", cacheError));
    }
}