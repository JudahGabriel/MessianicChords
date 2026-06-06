import { html, LitElement, TemplateResult } from "lit";
import { property, customElement } from "lit/decorators.js";
import { ChordSheet } from "../models/interfaces";
import { sharedStyles } from "../common/shared.styles";
import { chordCardStyles } from "./chord-card.styles";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

@customElement("chord-card")
export class ChordCard extends LitElement {
    @property({ type: Object }) chord: ChordSheet | null = null;
    @property({ type: Boolean, attribute: "new-window" }) newWindow = false;

    static styles = [sharedStyles, chordCardStyles];

    render(): TemplateResult {
        if (!this.chord) {
            return html``;
        }

        const target = this.newWindow ? "_blank" : "_self";
        const artist = this.chord.artist || this.chord.authors.join(", ");

        return html`
            <sl-card class="chord-card">
                <a class="card-link" href="/${this.chord.id.toLowerCase()}" target="${target}">
                    <div class="card-media">
                        ${this.renderBackground()}

                        <div class="overlay overlay-top">
                            <div class="song-name">${this.chord.song}</div>
                        </div>

                        <div class="overlay overlay-bottom">
                            <div class="artist">
                                ${artist}
                            </div>
                            ${this.renderKey()}
                        </div>
                    </div>
                </a>
            </sl-card>
        `;
    }

    renderBackground(): TemplateResult {
        if (this.chord?.albumArtUrl) {
            return html`<img class="album-art" src="${this.chord.albumArtUrl}" alt="Album art for ${this.chord.song}" loading="lazy" />`;
        }

        return html`
            <div class="fallback-art" aria-hidden="true">
                <sl-icon name="file-text"></sl-icon>
            </div>
        `;
    }

    renderKey(): TemplateResult {
        if (this.chord && this.chord.key) {
            return html`
                <div class="key">
                    <span>Key:</span>
                    ${this.chord.key}
                </div>`;
        }

        return html``;
    }
}
