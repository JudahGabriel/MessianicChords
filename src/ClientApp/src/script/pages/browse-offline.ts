import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components/chord-collection";
import "../components/load-more-button";
import { ChordSheet } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordBackendOffline } from "../services/chord-backend-offline";
import { ChordBackendOnline } from "../services/chord-backend-online";
import { ChordsLocalDatabase } from "../services/chords-local-database";
import { sharedStyles } from "../common/shared.styles";
import { browseOfflineStyles } from "./browse-offline.styles";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";

@customElement("browse-offline")
export class BrowseOffline extends LitElement {
    static styles = [sharedStyles, browseOfflineStyles];

    @state() private visibleChords: PagedList<ChordSheet> = PagedList.empty<ChordSheet>();
    @state() private isLoading = true;
    @state() private isCachingAll = false;
    @state() private isDeletingAll = false;
    @state() private cacheCurrent = 0;
    @state() private cacheTotal = 0;
    @state() private status = "";
    @state() private error: string | null = null;

    private readonly offlineBackend = new ChordBackendOffline();
    private readonly onlineBackend = new ChordBackendOnline();
    private readonly chordCache = new ChordsLocalDatabase();
    private readonly visibleChordsChanged = () => this.onVisibleChordsChanged();

    connectedCallback(): void {
        super.connectedCallback();
        this.loadOfflineChords();
    }

    render(): TemplateResult {
        return html`
            <section class="container page">
                <div class="header-row">
                    <h2 class="highlight">Offline Chord Charts</h2>
                    <div class="actions">
                        <wa-button
                            id="offline-download-all-btn"
                            ?loading="${this.isCachingAll}"
                            ?disabled="${this.isLoading || this.isCachingAll || this.isDeletingAll}"
                            @click="${this.makeAllChordsOffline}">
                            <wa-icon slot="start" name="download"></wa-icon>
                            Make all chords available offline
                        </wa-button>
                        <wa-button
                            id="offline-delete-all-btn"
                            variant="danger"
                            ?loading="${this.isDeletingAll}"
                            ?disabled="${this.isLoading || this.isCachingAll || this.isDeletingAll}"
                            @click="${this.deleteAllOfflineChords}">
                            <wa-icon slot="start" name="trash"></wa-icon>
                            Delete offline chords
                        </wa-button>
                    </div>
                </div>
                <wa-tooltip for="offline-download-all-btn">Downloads all chord charts to this device so they can be viewed while offline</wa-tooltip>
                <wa-tooltip for="offline-delete-all-btn">Removes all chord charts from your local device</wa-tooltip>
                <p>Chord charts you load while online are automatically available offline.</p>

                ${this.status ? html`<div class="status">${this.status}</div>` : html``}
                ${this.error ? html`<div class="status error">${this.error}</div>` : html``}
                ${this.renderProgressBar()}
                ${this.renderContent()}
                <div id="media-prefetch-host" class="media-prefetch-host" aria-hidden="true"></div>
            </section>
        `;
    }

    private renderProgressBar(): TemplateResult {
        if (!this.isCachingAll || this.cacheTotal === 0) {
            return html``;
        }

        return html`
            <wa-progress-bar value="${this.cachePercent}"></wa-progress-bar>
        `;
    }

    private renderContent(): TemplateResult {
        if (this.isLoading) {
            return html`<p class="empty-state">Loading offline chord charts...</p>`;
        }

        if (this.visibleChords.items.length === 0) {
            return html`<p class="empty-state">No offline chord charts found.</p>`;
        }

        return html`
            <chord-collection .chords="${this.visibleChords}"></chord-collection>
            <div class="text-center mt-3">
                <load-more-button .list="${this.visibleChords}"></load-more-button>
            </div>
        `;
    }

    private get cachePercent(): number {
        if (this.cacheTotal === 0) {
            return 0;
        }

        return Math.floor((this.cacheCurrent / this.cacheTotal) * 100);
    }

    private async loadOfflineChords(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            this.visibleChords = this.createOfflinePagedList();
            await this.visibleChords.fetch();
        } catch (error) {
            console.error("Failed loading offline chord charts", error);
            this.error = "Unable to load offline chord charts.";
            this.applyVisibleChords([]);
        } finally {
            this.isLoading = false;
        }
    }

    private createOfflinePagedList(): PagedList<ChordSheet> {
        this.visibleChords.removeEventListener("changed", this.visibleChordsChanged);

        const pagedList = new PagedList<ChordSheet>((skip, take) => this.offlineBackend.getBySongName(skip, take));
        pagedList.take = 250;
        pagedList.addEventListener("changed", this.visibleChordsChanged);
        return pagedList;
    }

    private applyVisibleChords(chords: ChordSheet[]): void {
        const pagedList = PagedList.empty<ChordSheet>();
        pagedList.items.push(...chords);
        pagedList.totalCount = chords.length;
        pagedList.hasMoreItems = false;
        this.visibleChords = pagedList;
        this.requestUpdate();
    }

    private async makeAllChordsOffline(): Promise<void> {
        if (this.isCachingAll) {
            return;
        }

        this.isCachingAll = true;
        this.error = null;
        this.cacheCurrent = 0;
        this.cacheTotal = 0;
        this.status = "Loading list of cacheable chord charts...";

        try {
            const cacheableChords = await this.onlineBackend.getCacheableChords();
            this.cacheTotal = cacheableChords.length;
            let succeeded = 0;
            let failed = 0;
            let skipped = 0;

            if (cacheableChords.length === 0) {
                this.status = "No cacheable chord charts were returned.";
                return;
            }

            for (let i = 0; i < cacheableChords.length; i++) {
                const chord = cacheableChords[i];
                this.cacheCurrent = i + 1;
                this.status = `Caching ${this.cacheCurrent} of ${this.cacheTotal} chord charts for offline use...`;

                try {
                    const isAlreadyOffline = await this.chordCache.has(chord.id);
                    if (isAlreadyOffline) {
                        skipped++;
                        continue;
                    }

                    await Promise.all([
                        this.chordCache.add(chord),
                        this.prefetchChordDetailsPage(chord),
                        this.cacheChordMedia(chord)
                    ]);
                    succeeded++;
                } catch (error) {
                    failed++;
                    console.warn("Failed to cache chord chart for offline use", chord.id, error);
                }
            }

            this.status = `Finished processing ${this.cacheTotal} chord charts: ${succeeded} cached, ${skipped} skipped (already offline), ${failed} failed.`;
            await this.loadOfflineChords();
        } catch (error) {
            console.error("Failed to cache all chords", error);
            this.error = "Unable to make all chord charts available offline. Please try again.";
        } finally {
            this.isCachingAll = false;
        }
    }

    private async deleteAllOfflineChords(): Promise<void> {
        if (this.isDeletingAll) {
            return;
        }

        const isConfirmed = window.confirm("Are you sure you want to delete all offline chord charts?");
        if (!isConfirmed) {
            return;
        }

        this.isDeletingAll = true;
        this.error = null;
        this.status = "Deleting offline chord charts...";

        try {
            await this.chordCache.deleteAll();
            this.status = "All offline chord charts were deleted.";
            await this.loadOfflineChords();
        } catch (error) {
            console.error("Failed deleting offline chord charts", error);
            this.error = "Unable to delete offline chord charts. Please try again.";
        } finally {
            this.isDeletingAll = false;
        }
    }

    private async cacheChordMedia(chord: ChordSheet): Promise<void> {
        const mediaUrls: string[] = [];

        if (chord.albumArtUrl) {
            mediaUrls.push(chord.albumArtUrl);
        }

        if (chord.screenshots?.length) {
            mediaUrls.push(...chord.screenshots);
        }

        for (const mediaUrl of mediaUrls) {
            await this.fetchAndIgnoreErrors(mediaUrl);
        }
    }

    private async prefetchChordDetailsPage(chord: ChordSheet): Promise<void> {
        const detailsUrl = this.chordDetailsUrl(chord);

        await this.prefetchIframe(detailsUrl);
    }

    private chordDetailsUrl(chord: ChordSheet): string {
        return this.toAbsoluteUrl(`/${chord.id.toLowerCase()}`);
    }

    private async fetchAndIgnoreErrors(url: string): Promise<void> {
        const absoluteUrl = this.toAbsoluteUrl(url);
        try {
            await this.prefetchImage(absoluteUrl);
        } catch (error) {
            console.warn("Unable to prefetch media for offline cache", absoluteUrl, error);
        }
    }

    private async prefetchImage(url: string): Promise<void> {
        const host = this.renderRoot.querySelector("#media-prefetch-host") as HTMLElement | null;
        if (!host) {
            throw new Error("Media prefetch host is missing from browse-offline page");
        }

        await new Promise<void>((resolve, reject) => {
            const img = document.createElement("img");

            const cleanup = () => {
                img.removeEventListener("load", onLoad);
                img.removeEventListener("error", onError);
                img.remove();
            };

            const onLoad = () => {
                cleanup();
                resolve();
            };

            const onError = (event: Event) => {
                const diagnostic = {
                    requestedUrl: url,
                    currentSrc: img.currentSrc || img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    referrerPolicy: img.referrerPolicy
                };
                console.error("Image prefetch failed", diagnostic, event);
                cleanup();
                reject(new Error(`Failed loading image: ${url}`));
            };

            img.decoding = "async";
            img.referrerPolicy = "no-referrer";
            img.addEventListener("load", onLoad, { once: true });
            img.addEventListener("error", onError, { once: true });
            host.appendChild(img);
            img.src = url;
        });
    }

    private async prefetchIframe(url: string): Promise<void> {
        const host = this.renderRoot.querySelector("#media-prefetch-host") as HTMLElement | null;
        if (!host) {
            throw new Error("Media prefetch host is missing from browse-offline page");
        }

        await new Promise<void>((resolve, reject) => {
            const iframe = document.createElement("iframe");

            const cleanup = () => {
                iframe.removeEventListener("load", onLoad);
                iframe.removeEventListener("error", onError);
                iframe.remove();
            };

            const onLoad = () => {
                cleanup();
                resolve();
            };

            const onError = (event: Event) => {
                console.error("Iframe prefetch failed", { requestedUrl: url }, event);
                cleanup();
                reject(new Error(`Failed loading iframe: ${url}`));
            };

            iframe.setAttribute("title", "offline-prefetch");
            iframe.setAttribute("aria-hidden", "true");
            iframe.tabIndex = -1;
            iframe.addEventListener("load", onLoad, { once: true });
            iframe.addEventListener("error", onError, { once: true });
            host.appendChild(iframe);
            iframe.src = url;
        });
    }

    private toAbsoluteUrl(url: string): string {
        try {
            return new URL(url, window.location.origin).toString();
        } catch {
            return url;
        }
    }

    private onVisibleChordsChanged(): void {
        if (this.isCachingAll || this.error) {
            this.requestUpdate();
            return;
        }

        const totalCount = this.visibleChords.totalCount ?? this.visibleChords.items.length;
        this.status = `You have ${totalCount} chord charts available offline on this device.`;
        this.requestUpdate();
    }
}
