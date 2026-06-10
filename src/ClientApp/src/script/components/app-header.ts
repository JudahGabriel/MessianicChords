import { html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { appHeaderStyles } from "./app-header.styles";
import { sharedStyles } from "../common/shared.styles";
import { UserViewModel } from "../models/account";
import { accountService } from "../services/account-service";
import { Subscription } from "rxjs";

import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";

@customElement("app-header")
export class AppHeader extends LitElement {

    static styles = [sharedStyles, appHeaderStyles];

    @state() menuOpen = false;
    @state() searchOpen = false;
    @state() user: UserViewModel | null = null;
    @state() isOnline: boolean = navigator.onLine;
    @state() locationPath = window.location.pathname;

    @query(".nav-search-desktop wa-input")
    private searchInput?: HTMLElement;

    private signedInStateSubscription: Subscription | null = null;
    private onlineStatusSubscription: Subscription | null = null;
    private readonly onAppRouteChanged = (): void => this.updateCurrentPath();
    private readonly onBrowserLocationChanged = (): void => this.updateCurrentPath();

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
        this.updateCurrentPath();
        window.addEventListener("online", this.onBrowserOnline);
        window.addEventListener("popstate", this.onBrowserLocationChanged);
        window.addEventListener("app-route-changed", this.onAppRouteChanged);
        window.addEventListener("account-changed", this.loadUser);
        this.listenForOfflineStatusChange();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.signedInStateSubscription?.unsubscribe();
        this.signedInStateSubscription = null;
        this.onlineStatusSubscription?.unsubscribe();
        this.onlineStatusSubscription = null;
        window.removeEventListener("online", this.onBrowserOnline);
        window.removeEventListener("popstate", this.onBrowserLocationChanged);
        window.removeEventListener("app-route-changed", this.onAppRouteChanged);
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

                        <div class="nav-left-right-group">
                            <div class="offline-mobile">
                                ${this.renderOfflineStatusIndicator()}
                            </div>

                            <wa-button
                                class="menu-toggle"
                                aria-label="Toggle menu"
                                @click="${this.toggleMenu}">
                                <wa-icon name="${this.menuOpen ? "x-lg" : "list"}"></wa-icon>
                            </wa-button>
                        </div>
                    </div>

                    <div class="nav-center">
                        <div class="nav-links ${this.menuOpen ? "open" : ""}">
                            <a class="${this.navLinkClass(["/"])}" href="/" @click="${this.closeMenu}">Home</a>
                            <a class="${this.navLinkClass(["/browse/newest"])}" href="/browse/newest" @click="${this.closeMenu}">Newest</a>
                            <a class="${this.navLinkClass(["/browse/songs"])}" href="/browse/songs" @click="${this.closeMenu}">Songs</a>
                            <a class="${this.navLinkClass(["/browse/artists", "/artist/"])}" href="/browse/artists" @click="${this.closeMenu}">Artists</a>
                            <a class="${this.navLinkClass(["/browse/tags"])}" href="/browse/tags" @click="${this.closeMenu}">Tags</a>
                            <a class="${this.navLinkClass(["/my/starred"])}" href="/my/starred" @click="${this.closeMenu}">Starred</a>
                            <a class="${this.navLinkClass(["/browse/random"])}" href="/browse/random" @click="${this.closeMenu}">Random</a>
                            <a id="offline-menu-link" class="${this.navLinkClass(["/browse/offline"])}" href="/browse/offline" @click="${this.closeMenu}">Offline</a>
                        </div>

                        <div class="nav-search nav-search-desktop ${this.searchOpen ? "open" : ""}">
                            ${this.searchOpen ? html`
                                <wa-input
                                    class="search-input"
                                    type="search"
                                    placeholder="Search chord charts"
                                    size="small"
                                    clearable
                                    pill
                                    @wa-change="${this.handleSearch}"
                                    @keydown="${this.handleSearchKeydown}">
                                    <wa-icon name="search" slot="start"></wa-icon>
                                </wa-input>
                            ` : html`
                                <wa-button
                                    class="search-toggle-button"
                                    aria-label="Open search"
                                    @click="${this.openSearch}">
                                    <wa-icon name="search"></wa-icon>
                                </wa-button>
                            `}
                        </div>
                    </div>

                    <div class="nav-search nav-search-mobile ${this.menuOpen ? "open" : ""}">
                        <wa-input
                            type="search"
                            placeholder="Search chord charts"
                            size="small"
                            clearable
                            pill
                            @wa-change="${this.handleSearch}">
                            <wa-icon name="search" slot="start"></wa-icon>
                        </wa-input>
                    </div>

                    <div class="nav-right ${this.menuOpen ? "open" : ""}">
                        <div class="offline-desktop">
                            ${this.renderOfflineStatusIndicator()}
                        </div>
                        ${this.renderAccountMenu()}
                    </div>
                </nav>
            </header>
        `;
    }

    private renderOfflineStatusIndicator(): TemplateResult {
        if (this.isOnline) {
            return html``;
        }

        return html`
            <wa-tooltip content="You're offline. Any chord charts you viewed while online are available offline." trigger="hover click" placement="bottom-end">
                <wa-button
                    class="offline-status-button"
                    aria-label="Offline status">
                    <wa-icon name="wifi-off"></wa-icon>
                </wa-button>
            </wa-tooltip>
        `;
    }

    private renderAccountMenu(): TemplateResult {
        return html`
            <wa-dropdown placement="bottom-end" @wa-select="${this.onAccountMenuSelected}" @wa-hide="${this.closeMenu}">
                ${this.renderAccountMenuTrigger()}

                ${this.user ? html`<wa-dropdown-item value="/profile">My Profile</wa-dropdown-item>` : html``}
                <wa-dropdown-item value="/contact">Contact Us</wa-dropdown-item>
                <wa-dropdown-item value="/about">About</wa-dropdown-item>
                ${this.user ? html`<wa-dropdown-item value="__signout">Sign Out</wa-dropdown-item>` : html``}
                ${this.user ? html`` : html`<wa-dropdown-item value="/account">Sign In</wa-dropdown-item>`}
                ${this.user ? html`` : html`<wa-dropdown-item value="/account?mode=register">Register</wa-dropdown-item>`}
            </wa-dropdown>
        `;
    }

    private renderAccountMenuTrigger(): TemplateResult {
        if (!this.user) {
            return html`
                <wa-button 
                    class="account-menu-trigger-signed-out" 
                    slot="trigger" 
                    appearance="plain">
                    <wa-icon name="person-circle" label="Account menu"></wa-icon>
                </wa-button>
            `;
        }

        // We have a user. Do we have a profile pic?
        if (this.user.profilePictureUrl) {
            return html`
                <wa-button 
                    class="account-menu-trigger" 
                    slot="trigger" 
                    appearance="plain">
                    <img class="avatar-image" src="${this.user.profilePictureUrl}" alt="Profile picture" />
                </wa-button>
            `;
        }
        
        // We have a user without a profile pic. Show the generic person icon.
        return html`
            <wa-button 
                class="account-menu-trigger" 
                slot="trigger" 
                appearance="plain">
                <wa-icon name="person-circle" label="Account menu"></wa-icon>
            </wa-button>
        `;

        // return html`
        //     <wa-button slot="trigger" variant="${triggerVariant}" class="${triggerClass}" ?circle="${useCircularTrigger}">
        //         ${profilePictureUrl ? html`` : initial ? html`` : html`<wa-icon name="list" label="Account menu"></wa-icon>`}
        //     </wa-button>
        // `;
    }

    private toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
    }

    private async openSearch(): Promise<void> {
        this.searchOpen = true;
        await this.updateComplete;
        this.searchInput?.focus();
    }

    private closeSearch(): void {
        this.searchOpen = false;
    }

    private closeMenu(): void {
        this.menuOpen = false;
    }

    private navLinkClass(paths: string[]): string {
        return this.isCurrentPath(paths) ? "active" : "";
    }

    private isCurrentPath(paths: string[]): boolean {
        const path = this.locationPath || "/";
        return paths.some(candidate => {
            if (candidate === "/") {
                return path === "/";
            }

            if (candidate.endsWith("/")) {
                return path.startsWith(candidate);
            }

            return path === candidate;
        });
    }

    private updateCurrentPath(): void {
        this.locationPath = window.location.pathname;
    }

    private handleSearch(e: Event): void {
        const value = (e.target as HTMLInputElement).value?.trim();
        if (value) {
            window.location.href = `/?search=${encodeURIComponent(value)}`;
        }
    }

    private handleSearchKeydown(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            this.closeSearch();
            return;
        }

        if (e.key !== "Enter") {
            return;
        }

        this.handleSearch(e);
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

    private readonly onBrowserOnline = (): void => {
        this.isOnline = navigator.onLine;
    };

    private async listenForOfflineStatusChange(): Promise<void> {
        const module = await import("../services/online-detector");
        this.onlineStatusSubscription = module.onlineDetector.onlineStatus.subscribe(status => {
            if (status !== null) {
                this.isOnline = status;
            }
        });
    }
}

