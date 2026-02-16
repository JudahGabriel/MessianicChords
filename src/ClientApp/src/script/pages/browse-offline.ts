import { TemplateResult, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
import { ChordSheet } from '../models/interfaces';
import { ChordCache } from '../services/chord-cache';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordService } from '../services/chord-service';

/**
 * Page for viewing chord charts that are available offline.
 */
@customElement('browse-offline')
export class BrowseOffline extends BootstrapBase {
    static get styles() {
        const localStyles = css`
          :host {
            font-family: var(--subtitle-font);
          }
        `;
        return [
            BootstrapBase.styles,
            localStyles
        ];
    };

    @state() chords: ChordSheet[] = [];
    @state() cachingStatus = "";
    chordsPagedList = new PagedList<ChordSheet>((skip, take) => this.chordCache.getAll(skip, take));
    readonly chordCache = new ChordCache();

    constructor() {
        super();
        this.chordsPagedList.take = 20;
        this.chordsPagedList.addEventListener("changed", () => {
            this.chords = this.chordsPagedList.items;
            this.requestUpdate();
        });
        this.chordsPagedList.getNextChunk();
    }

    render(): TemplateResult {
        return html`
      <div class="container">
          <div class="d-flex flex-column">
            <h3 class="highlight">Offline chord charts</h3>
            <button class="btn btn-light ms-2" @click="${this.fetchOfflineCapableChords}" ?disabled="${this.cachingStatus !== ""}" style="text-align: left; display: inline-block; width: fit-content;">
              Cache all chord charts for offline use
            </button>
            <p>
                ${this.cachingStatus}
            </p>
          </div>
          ${this.renderMainContent()}
      </div>
  `;
    }

    renderMainContent(): TemplateResult {
        if (!this.chords) {
            return html``;
        }

        if (this.chordsPagedList.isLoading && this.chordsPagedList.items.length === 0) {
            return this.renderLoading();
        }

        if (this.chords.length === 0) {
            return html`
          <h5>No chord charts available offline.</h5>
          <p>To make chord charts available offline, first go online and view some chord charts. They'll be made offline automatically.</p>
      `;
        }

        return this.renderChords(this.chordsPagedList);
    }

    renderLoading(): TemplateResult {
        const items = [1, 2, 3];
        return html`
      <div class="d-flex flex-wrap justify-content-evenly">
          ${repeat(items, i => i, () => html`
          <chord-card-loading></chord-card-loading>
          `)}
      </div>
  `;
    }

    renderChords(chords: PagedList<ChordSheet>): TemplateResult {
        return html`
      <div class="d-flex flex-wrap justify-content-evenly">
          ${repeat(chords.items, c => c.id, c => this.renderChord(c))}
      </div>
      
      <div class="text-center mt-3">
          <load-more-button .list="${chords}"></load-more-button>
      </div>
  `;
    }

    renderChord(chord: ChordSheet | null): TemplateResult {
        return html`
      <chord-card .chord="${chord}"></chord-card>
  `;
    }

    async fetchOfflineCapableChords(): Promise<void> {
        this.cachingStatus = "Staring to caching...";
        let cachedChordCount = 0;
        let screenshotCacheCount = 0;
        let screenshotFailCount = 0;
        const img = document.createElement("img");
        document.body.appendChild(img);

        const cacheableChords = await new ChordService().getCacheableChords();
        this.cachingStatus = `Found ${cacheableChords.length} chord charts to cache...`;

        // Get the ones with plain text chords first, as they're easiest to cache.
        cacheableChords.sort((a, b) => {
            const aHasChords = a.chords && a.chords.trim() !== "";
            const bHasChords = b.chords && b.chords.trim() !== "";

            return Number(bHasChords) - Number(aHasChords);
        }); 
        for (const chordChart of cacheableChords) {
            this.cachingStatus = `Caching chords chart ${cachedChordCount + 1} of ${cacheableChords.length}...`;
            for (const screenshot of (chordChart.screenshots || [])) {
                try {
                    await this.tryLoadImage(screenshot, img);
                    screenshotCacheCount++;
                } catch (screenshotError) {
                    console.warn("Failed to load screenshot due to an error", screenshot, screenshotError);
                    screenshotFailCount++;
                }
            }

            // Once that's done, add the chord chart to the IndexDB cache.
            this.chordCache.add(chordChart);
            cachedChordCount++;
        }

        this.cachingStatus = `Caching completed. ${cachedChordCount} chords cached, ${screenshotCacheCount} screenshots cached, ${screenshotFailCount} screenshots failed to load.`;
    }

    tryLoadImage(uri: string, imgEl: HTMLImageElement): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            imgEl.onload = () => {
                resolve();
            };
            imgEl.onerror = (error) => {
                reject(error);
            };
            imgEl.src = uri;
        });
    }
}