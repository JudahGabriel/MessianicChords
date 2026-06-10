import { html, LitElement, PropertyValueMap, TemplateResult } from "lit";
import { property, customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { PagedList } from "../models/paged-list";
import { ChordSheet } from "../models/interfaces";
import { sharedStyles } from "../common/shared.styles";
import { chordCollectionStyles } from "./chord-collection.styles";
import "@awesome.me/webawesome/dist/components/skeleton/skeleton.js";
import "../components/chord-card";

/**
 * Displays a collection of chord chart cards.
 */
@customElement("chord-collection")
export class ChordCollection extends LitElement {
    @property({ type: Object }) chords: PagedList<ChordSheet> | null = null;
    @state() chordList: ChordSheet[] = [];
    @state() isLoading = false;
    readonly chordsChangedHandler = () => this.chordsChanged();
    readonly isInTabbedPwa = window.matchMedia("(display-mode: tabbed)").matches;

    static styles = [sharedStyles, chordCollectionStyles];

    updated(props: PropertyValueMap<this>) {
        if (props.has("chords")) {
            // Remove the old chords listener.
            const oldChords = props.get("chords") as PagedList<ChordSheet> | null;
            if (oldChords) {
                oldChords.removeEventListener("changed", this.chordsChangedHandler);
            }

            // Setup the new chords listener
            if (this.chords) {
                this.chords.addEventListener("changed", this.chordsChangedHandler);
            }

            // Sync immediately so pre-populated lists render without waiting for a "changed" event.
            this.chordsChanged();
        }
    }

    render(): TemplateResult {
        if (!this.chords) {
            return html``;
        }

        return html`
            <div class="chords-container w-100 d-flex flex-wrap justify-content-evenly align-items-stretch">
                ${repeat(this.chordList, c => c.id, c => this.renderChordCard(c))}
                ${this.renderLoading()}
            </div>
        `;
    }

    private renderLoading(): TemplateResult {
        if (!this.isLoading) {
            return html``;
        }

        return html`
            ${repeat([1, 2, 3], () => this.renderLoadingCard())}
        `;
    }

    private renderLoadingCard(): TemplateResult {
        return html`
            <wa-card class="loading-card" aria-hidden="true">
                <div class="loading-media">
                    <div class="loading-overlay loading-overlay-top">
                        <wa-skeleton class="title" effect="pulse"></wa-skeleton>
                    </div>

                    <div class="loading-overlay loading-overlay-bottom">
                        <wa-skeleton class="artist" effect="pulse"></wa-skeleton>
                        <wa-skeleton class="key" effect="pulse"></wa-skeleton>
                    </div>
                </div>
            </wa-card>
        `;
    }

    private renderChordCard(chordSheet: ChordSheet): TemplateResult {
        return html`
            <chord-card .chord="${chordSheet}" ?new-window="${this.isInTabbedPwa}"></chord-card>
        `;
    }

    private chordsChanged() {
        this.isLoading = this.chords?.isLoading || false;
        this.chordList = [...(this.chords?.items || [])];
    }
}
