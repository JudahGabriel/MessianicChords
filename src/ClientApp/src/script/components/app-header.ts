import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { appHeaderStyles } from "./app-header.styles";
import { sharedStyles } from "../common/shared.styles";
import { UserViewModel } from "../models/account";
import { accountService } from "../services/account-service";
import { Subscription } from "rxjs";

import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";

@customElement("app-header")
export class AppHeader extends LitElement {

    static styles = [sharedStyles, appHeaderStyles];

    @state() menuOpen = false;
    @state() user: UserViewModel | null = null;

    private signedInStateSubscription: Subscription | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        this.signedInStateSubscription = accountService.signedInState.subscribe(signedIn => {
            if (!signedIn) {
                this.user = null;
            } else {
                this.loadUser();
            }
        });

        this.loadUser();
        window.addEventListener("account-changed", this.loadUser);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.signedInStateSubscription?.unsubscribe();
        this.signedInStateSubscription = null;
        window.removeEventListener("account-changed", this.loadUser);
    }

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
                            placeholder="Search chord charts"
                            size="small"
                            clearable
                            pill
                            @sl-change="${this.handleSearch}">
                            <sl-icon name="search" slot="prefix"></sl-icon>
                        </sl-input>
                    </div>

                    <div class="nav-right ${this.menuOpen ? "open" : ""}">
                        ${this.renderAccountMenu()}
                    </div>
                </nav>
            </header>
        `;
    }

    private renderAccountMenu(): TemplateResult {
        return html`
            <sl-dropdown placement="bottom-end" @sl-hide="${this.closeMenu}">
                ${this.renderAccountMenuTrigger()}

                <sl-menu @sl-select="${this.onAccountMenuSelected}">
                    ${this.user ? html`<sl-menu-item value="/profile">My Profile</sl-menu-item>` : html``}
                    ${this.user ? html`<sl-menu-item value="/my/starred">Starred Chord Charts</sl-menu-item>` : html``}
                    <sl-menu-item value="/contact">Contact Us</sl-menu-item>
                    <sl-menu-item value="/about">About</sl-menu-item>
                    ${this.user ? html`<sl-menu-item value="__signout">Sign Out</sl-menu-item>` : html``}
                    ${this.user ? html`` : html`<sl-menu-item value="/account">Sign In</sl-menu-item>`}
                    ${this.user ? html`` : html`<sl-menu-item value="/account?mode=register">Register</sl-menu-item>`}
                </sl-menu>
            </sl-dropdown>
        `;
    }

    private renderAccountMenuTrigger(): TemplateResult {
        if (!this.user) {
            return html`
                <sl-button 
                    class="account-menu-trigger-signed-out" 
                    slot="trigger" 
                    variant="text">
                    <sl-icon name="person-circle" label="Account menu"></sl-icon>
                </sl-button>
            `;
        }

        // We have a user. Do we have a profile pic?
        if (this.user.profilePictureUrl) {
            return html`
                <sl-button 
                    class="account-menu-trigger" 
                    slot="trigger" 
                    variant="text">
                    <img class="avatar-image" src="${this.user.profilePictureUrl}" alt="Profile picture" />
                </sl-button>
            `;
        }
        
        // We have a user without a profile pic. Show the generic person icon.
        return html`
            <sl-button 
                class="account-menu-trigger" 
                slot="trigger" 
                variant="text">
                <sl-icon name="person-circle" label="Account menu"></sl-icon>
            </sl-button>
        `;

        // return html`
        //     <sl-button slot="trigger" variant="${triggerVariant}" class="${triggerClass}" ?circle="${useCircularTrigger}">
        //         ${profilePictureUrl ? html`` : initial ? html`` : html`<sl-icon name="list" label="Account menu"></sl-icon>`}
        //     </sl-button>
        // `;
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

    private async onAccountMenuSelected(e: CustomEvent): Promise<void> {
        const value = (e.detail.item as { value?: string })?.value;
        if (!value) {
            return;
        }

        this.closeMenu();

        if (value === "__signout") {
            try {
                await accountService.signOut();
                this.user = null;
                window.dispatchEvent(new CustomEvent("account-changed"));
                window.location.href = "/";
            } catch {
                // Keep menu action resilient; account page has richer error handling.
            }
            return;
        }

        window.location.href = value;
    }

    private loadUser() {
        accountService.getUser()
            .then(user => this.user = user)
            .catch(() => this.user = null);
    }
}