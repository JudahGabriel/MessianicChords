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

        const chordHref = `/${this.chord.id.toLowerCase()}`;
        return html`
            <sl-card class="chord-card">
                <a
                    class="card-media card-media-link card-link"
                    href="${chordHref}"
                    .target="${this.newWindow ? "_blank" : ""}"
                    rel="${this.newWindow ? "noopener" : ""}"
                    @click="${this.onCardClick}">
                    ${this.renderBackground()}>

                    <div class="overlay overlay-top">
                        <div class="song-name">${this.chord.song}</div>
                    </div>

                    <div class="overlay overlay-bottom">
                        <span
                            class="artist artist-link"
                            role="link"
                            @click="${(e: Event) => this.onArtistClick(e, artistHref)}">
                            ${artist}
                        </span>
                        ${this.renderKey()}
                    </div>
                </a>
            </sl-card>
        `;
    }

    private getArtistWithAuthors(chord: ChordSheet): string {
        if (!chord.authors || chord.authors.length === 0) {
            return chord.artist?.trim() || "Unknown artist";
        }

        const artistAuthorsSet = new Set([chord.artist?.trim(), ...chord.authors.map(a => a.trim())]);
        return Array.from(artistAuthorsSet).filter(a => !!a).join(", ");
    }

    private onCardClick(e: MouseEvent): void {
        // Allow default browser behavior for ctrl+click, cmd+click, middle-click, etc.
        // These open in a new tab/window natively via the <a> element.
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
            return;
        }

        // For normal clicks, navigate via JS for SPA-like behavior.
        if (!this.newWindow) {
            e.preventDefault();
            window.location.href = (e.currentTarget as HTMLAnchorElement).href;
        }
    }

    private onArtistClick(e: Event, href: string): void {
        // Stop propagation so the parent <a> doesn't navigate to the chord detail page.
        e.preventDefault();
        e.stopPropagation();
        window.location.href = href;
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
