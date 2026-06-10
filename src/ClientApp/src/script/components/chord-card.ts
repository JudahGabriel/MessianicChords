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

        const artist = this.getArtistWithAuthors(this.chord);
        const artistRouteName = this.chord.artist || this.chord.authors[0] || "";
        const artistHref = `/artist/${encodeURIComponent(artistRouteName)}`;

        return html`
            <sl-card class="chord-card">
                <div
                    class="card-media card-media-link"
                    role="link"
                    tabindex="0"
                    @click="${() => this.navigateToChordDetails()}"
                    @keydown="${this.onCardKeydown}">
                    ${this.renderBackground()}

                    <div class="overlay overlay-top">
                        <div class="song-name">${this.chord.song}</div>
                    </div>

                    <div class="overlay overlay-bottom">
                        <a
                            class="artist artist-link"
                            href="${artistHref}"
                            @click="${this.onArtistClick}">
                            ${artist}
                        </a>
                        ${this.renderKey()}
                    </div>
                </div>
            </sl-card>
        `;
    }

    private getArtistWithAuthors(chord: ChordSheet): string {
        if (!chord.authors || chord.authors.length === 0) {
            return chord.artist?.trim() || "Unknown artist";
        }

        const artistAuthorsSet = new Set([chord.artist?.trim(), ...chord.authors.map(a => a.trim())]);
        return Array.from(artistAuthorsSet).join(", ");
    }

    private navigateToChordDetails(): void {
        if (!this.chord) {
            return;
        }

        const href = `/${this.chord.id.toLowerCase()}`;
        if (this.newWindow) {
            window.open(href, "_blank", "noopener");
            return;
        }

        window.location.href = href;
    }

    private onCardKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.navigateToChordDetails();
        }
    }

    private onArtistClick(e: Event): void {
        // Keep artist link navigation independent from the card click handler.
        e.stopPropagation();
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
