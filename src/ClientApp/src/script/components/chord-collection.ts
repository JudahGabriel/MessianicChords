import { html, LitElement, PropertyValueMap, TemplateResult } from "lit";
import { property, customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { PagedList } from "../models/paged-list";
import { ChordSheet } from "../models/interfaces";
import { sharedStyles } from "../common/shared.styles";
import { chordCollectionStyles } from "./chord-collection.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";
import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
import "../components/chord-card";

/**
 * Displays a collection of chord chart cards.
 */
@customElement("chord-collection")
export class ChordCollection extends LitElement {
    @property({ type: Object }) chords: PagedList<ChordSheet> | null = null;
    @state() isLoading = false;
    readonly chordsChangedHandler = () => this.chordsChanged();
    readonly isInTabbedPwa = window.matchMedia('(display-mode: tabbed)').matches;

    static styles = [sharedStyles, bootstrapUtilities, chordCollectionStyles];

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
        }
    }

    render(): TemplateResult {
        if (!this.chords) {
            return html``;
        }        

        return html`
            <div class="chords-container w-100 d-flex flex-wrap justify-content-evenly align-items-stretch">
                ${repeat(this.chords.items, c => c.id, c => this.renderChordCard(c))}
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
            <sl-card class="loading-card">
                <div slot="header">
                    <sl-skeleton class="title" effect="pulse"></sl-skeleton>
                </div>

                <div>
                    <h6>
                        <sl-skeleton class="artist" effect="pulse"></sl-skeleton>
                    </h6>
                    <h6>
                        <sl-skeleton class="key" effect="pulse"></sl-skeleton>
                    </h6>
                </div>
            </sl-card>
        `;
    }

    private renderChordCard(chordSheet: ChordSheet): TemplateResult {
        return html`
            <chord-card .chord="${chordSheet}" ?new-window="${this.isInTabbedPwa}"></chord-card>
        `;
    }

    private chordsChanged() {
        this.isLoading = this.chords?.isLoading || false;
    }
}