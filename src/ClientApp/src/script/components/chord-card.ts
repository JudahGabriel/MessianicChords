import { html, LitElement, TemplateResult } from "lit";
import { property, customElement } from "lit/decorators.js";
import { ChordSheet } from "../models/interfaces";
import { sharedStyles } from "../common/shared.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";
import { chordCardStyles } from "./chord-card.styles";
import "@shoelace-style/shoelace/dist/components/card/card.js";

@customElement("chord-card")
export class ChordCard extends LitElement {
    @property({ type: Object }) chord: ChordSheet | null = null;
    @property({ type: Boolean, attribute: "new-window" }) newWindow = false;

    static styles = [sharedStyles, bootstrapUtilities, chordCardStyles];

    render(): TemplateResult {
        if (!this.chord) {
            return html``;
        }

        const target = this.newWindow ? "_blank" : "_self";
        return html`
            <sl-card class="card chord-card">
                <div slot="header">
                    <div class="card-title d-flex justify-content-between">
                        <a class="song-name" href="${this.chord.id}" target="${target}">
                            ${this.chord.song}
                        </a>
                        ${this.renderHebrewName()}
                    </div>
                </div>

                <h6 class="card-subtitle mb-2 text-muted">
                    <a class="artist" href="/artist/${encodeURIComponent(this.chord.artist || this.chord.authors[0])}" target="${target}">
                        ${this.chord.artist || this.chord.authors.join(", ")}
                    </a>
                </h6>
                ${this.renderKey()}
            </sl-card>
        `;
    }

    renderHebrewName(): TemplateResult {
        const target = this.newWindow ? "_blank" : "_self";
        if (this.chord && this.chord.hebrewSongName) {
            return html`
                <a class="hebrew-song-name" href="/${this.chord.id}" target="${target}" lang="he">
                    ${this.chord.hebrewSongName}
                </a>`;
        }

        return html``;
    }

    renderKey(): TemplateResult {
        if (this.chord && this.chord.key) {
            return html`
                <h6 class="card-subtitle mb-2 text-muted key">
                    <span>Key of</span>
                    ${this.chord.key}
                </h6>`;
        }

        return html``;
    }
}
