import { RouterLocation } from "@vaadin/router";
import { css, html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { BootstrapBase } from "../common/bootstrap-base";
import { SizeMax } from "../common/constants";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { repeat } from 'lit/directives/repeat.js';
import { ChordCache } from "../services/chord-cache";

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
            .img-preview {
                box-shadow: 0 0 3px 0px silver;
                margin-top: 13px;
            }

            @media print {
                .web-published-doc,
                .img-preview {
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
    location: RouterLocation | null = null;
    readonly chordService = new ChordService();
    readonly chordCache = new ChordCache();

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
                        <div class="btn-group" role="group" aria-label="First group">
                            <a href="${this.downloadUrl(chord)}" target="_blank" download="" class="btn btn-light" title="Download">
                                <img src="/assets/bs-icons/save.svg" alt="Download">
                            </a>
                            <button type="button" class="btn btn-light" title="Print" @click="${this.print}">
                                <img src="/assets/bs-icons/printer.svg" alt="Print">
                            </button>
                            ${this.renderPlayButton()}
                            ${this.renderFullScreenButton()}
                            <a href="${chord.address}" target="_blank" class="btn btn-light" title="Open on Google Drive">
                                <img src="/assets/bs-icons/box-arrow-up-right.svg" alt="Open">
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

    renderPlayButton(): TemplateResult {
        if (!this.chord?.chavahSongId) {
            return html``;
        }

        return html`
            <a href="http://messianicradio.com?song=${this.chord.chavahSongId}" target="_blank" class="btn btn-light" title="Play">
                <img src="/assets/bs-icons/play-circle.svg" alt="Play">
            </a>
        `;
    }

    renderFullScreenButton(): TemplateResult {
        if (!this.canGoFullScreen) {
            return html``;
        }

        return html`
            <button type="button" class="btn btn-light" title="View fullscreen" @click="${this.goFullscreen}">
                <img src="/assets/bs-icons/arrows-fullscreen.svg" alt="Fullscreen">
            </button>
        `;
    }

    renderChordPreviewer(chord: ChordSheet): TemplateResult {
        // Are we offline? Then we only support display via screenshots of the doc.
        let previewer: TemplateResult;

        // If we're not online, see if we can render the offline previewer (i.e. the screenshots of the doc)
        // This is needed because we can't load iframes of other domains (Google Docs) while offline, even with service worker caching.
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
        return this.shadowRoot?.querySelector("iframe")?.requestFullscreen();
    }

    cacheChordForOfflineSearch(chord: ChordSheet) {
        this.chordCache.add(chord)
            .catch(cacheError => console.warn("Unable to add chord sheet to offline chord cache due to an error", cacheError));
    }
}