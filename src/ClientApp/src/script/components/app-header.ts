import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { appHeaderStyles } from "./app-header.styles";
import { sharedStyles } from "../common/shared.styles";

import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

@customElement("app-header")
export class AppHeader extends LitElement {

    static styles = [sharedStyles, appHeaderStyles];

    @state() menuOpen = false;

    render(): TemplateResult {
        return html`
            <header>
                <nav>
                    <div class="nav-left">
                        <a href="/" class="logo-link">
                            <img src="/assets/images/64x64.png" alt="Messianic Chords logo" width="40" height="40" />
                            <span class="app-name">Messianic Chords</span>
                        </a>

                        <sl-icon-button
                            class="menu-toggle"
                            name="${this.menuOpen ? "x-lg" : "list"}"
                            label="Toggle menu"
                            @click="${this.toggleMenu}">
                        </sl-icon-button>
                    </div>

                    <div class="nav-links ${this.menuOpen ? "open" : ""}">
                        <a href="/" @click="${this.closeMenu}">Home</a>
                        <a href="/browse/songs" @click="${this.closeMenu}">Songs</a>
                        <a href="/browse/artists" @click="${this.closeMenu}">Artists</a>
                        <a href="/browse/random" @click="${this.closeMenu}">Random</a>
                    </div>

                    <div class="nav-search ${this.menuOpen ? "open" : ""}">
                        <sl-input
                            type="search"
                            placeholder="Search songs..."
                            size="small"
                            clearable
                            pill
                            @sl-change="${this.handleSearch}">
                            <sl-icon name="search" slot="prefix"></sl-icon>
                        </sl-input>
                    </div>

                    <div class="nav-right ${this.menuOpen ? "open" : ""}">
                        <sl-button variant="default" size="small" pill @click="${this.signIn}">
                            <sl-icon slot="prefix" name="person"></sl-icon>
                            Sign in
                        </sl-button>
                    </div>
                </nav>
            </header>
        `;
    }

    private toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
    }

    private closeMenu(): void {
        this.menuOpen = false;
    }

    private handleSearch(e: Event): void {
        const value = (e.target as HTMLInputElement).value?.trim();
        if (value) {
            window.location.href = `/?search=${encodeURIComponent(value)}`;
        }
    }

    private signIn(): void {
        this.dispatchEvent(new CustomEvent("signin", { bubbles: true, composed: true }));
    }
}