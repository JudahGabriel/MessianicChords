import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components/chord-collection";
import "../components/load-more-button";
import { ChordSheet } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordBackendOffline } from "../services/chord-backend-offline";
import { ChordBackendOnline } from "../services/chord-backend-online";
import { ChordCache } from "../services/chord-cache";
import { sharedStyles } from "../common/shared.styles";
import { browseOfflineStyles } from "./browse-offline.styles";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js";

@customElement("browse-offline")
export class BrowseOffline extends LitElement {
    static styles = [sharedStyles, browseOfflineStyles];

    @state() private visibleChords: PagedList<ChordSheet> = PagedList.empty<ChordSheet>();
    @state() private isLoading = true;
    @state() private isCachingAll = false;
    @state() private cacheCurrent = 0;
    @state() private cacheTotal = 0;
    @state() private status = "";
    @state() private error: string | null = null;

    private readonly offlineBackend = new ChordBackendOffline();
    private readonly onlineBackend = new ChordBackendOnline();
    private readonly chordCache = new ChordCache();
    private readonly visibleChordsChanged = () => this.onVisibleChordsChanged();

    connectedCallback(): void {
        super.connectedCallback();
        this.loadOfflineChords();
    }

    render(): TemplateResult {
        return html`
            <section class="container page">
                <h2 class="highlight">Offline Chord Charts</h2>
                <p>Chord charts you load while online are automatically available offline.</p>
                <div class="toolbar">
                    <sl-button
                        variant="primary"
                        ?loading="${this.isCachingAll}"
                        ?disabled="${this.isLoading || this.isCachingAll}"
                        @click="${this.makeAllChordsOffline}">
                        Make all chords offline
                    </sl-button>
                </div>

                ${this.status ? html`<div class="status">${this.status}</div>` : html``}
                ${this.error ? html`<div class="status error">${this.error}</div>` : html``}
                ${this.renderProgressBar()}
                ${this.renderContent()}
            </section>
        `;
    }

    private renderProgressBar(): TemplateResult {
        if (!this.isCachingAll || this.cacheTotal === 0) {
            return html``;
        }

        return html`
            <sl-progress-bar value="${this.cachePercent}"></sl-progress-bar>
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

            if (cacheableChords.length === 0) {
                this.status = "No cacheable chord charts were returned.";
                return;
            }

            for (let i = 0; i < cacheableChords.length; i++) {
                const chord = cacheableChords[i];
                this.cacheCurrent = i + 1;
                this.status = `Caching ${this.cacheCurrent} of ${this.cacheTotal} chord charts for offline use...`;

                await this.chordCache.add(chord);
                await this.cacheChordMedia(chord);
            }

            this.status = `Finished caching ${this.cacheTotal} chord charts for offline use.`;
            await this.loadOfflineChords();
        } catch (error) {
            console.error("Failed to cache all chords", error);
            this.error = "Unable to make all chord charts available offline. Please try again.";
        } finally {
            this.isCachingAll = false;
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

    private async fetchAndIgnoreErrors(url: string): Promise<void> {
        const absoluteUrl = this.toAbsoluteUrl(url);
        try {
            await fetch(absoluteUrl);
        } catch (error) {
            console.warn("Unable to prefetch media for offline cache", absoluteUrl, error);
        }
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
        this.status = `Showing ${this.visibleChords.items.length} of ${totalCount} offline chord charts.`;
        this.requestUpdate();
    }
}
