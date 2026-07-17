import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountPageStyles } from "./account-page.styles";
import { SignInStatus, UserViewModel } from "../models/account";
import { accountService } from "../services/account-service";

import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";

@customElement("account-page")
export class AccountPage extends LitElement {
    static styles = [accountPageStyles];

    @state() mode: "signin" | "register" = "signin";
    @state() email = "";
    @state() password = "";
    @state() confirmPassword = "";
    @state() staySignedIn = true;
    @state() isSubmitting = false;
    @state() error: string | null = null;
    @state() success: string | null = null;
    @state() user: UserViewModel | null = null;

    private readonly accountService = accountService;

    connectedCallback(): void {
        super.connectedCallback();
        const mode = new URLSearchParams(window.location.search).get("mode");
        if (mode === "signin" || mode === "register") {
            this.mode = mode;
        }

        this.accountService.getUser()
            .then(user => this.user = user)
            .catch(() => this.user = null);
    }

    render(): TemplateResult {
        return html`
            <section class="account-page">
                <div class="card">
                    <h1>Sign in or register</h1>
                    ${this.user ? this.renderSignedIn() : this.renderForms()}
                </div>
            </section>
        `;
    }

    private renderSignedIn(): TemplateResult {
        return html`
            <div class="signed-in">
                <p class="intro">You're signed in as <strong>${this.user?.email || this.user?.userName}</strong>.</p>
                <wa-button variant="primary" pill href="/">Return home</wa-button>
                <wa-button variant="default" pill ?loading="${this.isSubmitting}" @click="${this.signOut}">
                    Sign out
                </wa-button>
            </div>
        `;
    }

    private renderForms(): TemplateResult {
        return html`
            <p class="intro">Sign in to your Messianic Chords account or create a new one.</p>
            <p class="intro">Signing in lets you upload new chord charts, edit chord charts, comment on charts, star your favorite charts, and more.</p>
            <wa-tab-group @wa-tab-show="${this.tabChanged}">
                <wa-tab slot="nav" panel="signin" ?active="${this.mode === "signin"}">Sign in</wa-tab>
                <wa-tab slot="nav" panel="register" ?active="${this.mode === "register"}">Register</wa-tab>

                <wa-tab-panel name="signin">
                    ${this.renderAlert()}
                    <form @submit="${this.submitSignIn}">
                        <wa-input
                            label="Email"
                            type="email"
                            autocomplete="email"
                            required
                            value="${this.email}"
                            @wa-input="${(e: Event) => this.email = (e.target as HTMLInputElement).value}">
                        </wa-input>
                        <wa-input
                            label="Password"
                            type="password"
                            autocomplete="current-password"
                            required
                            minlength="6"
                            password-toggle
                            value="${this.password}"
                            @wa-input="${(e: Event) => this.password = (e.target as HTMLInputElement).value}">
                        </wa-input>
                        <wa-checkbox
                            ?checked="${this.staySignedIn}"
                            @wa-change="${(e: Event) => this.staySignedIn = (e.target as HTMLInputElement).checked}">
                            Stay signed in
                        </wa-checkbox>
                        <wa-button variant="primary" type="submit" pill ?loading="${this.isSubmitting}">
                            Sign in
                        </wa-button>
                    </form>
                    <p class="toggle-copy">
                        Need an account?
                        <button class="link-button" type="button" @click="${() => this.switchMode("register")}">Register</button>
                    </p>
                </wa-tab-panel>

                <wa-tab-panel name="register">
                    ${this.renderAlert()}
                    <form @submit="${this.submitRegister}">
                        <wa-input
                            label="Email"
                            type="email"
                            autocomplete="email"
                            required
                            value="${this.email}"
                            @wa-input="${(e: Event) => this.email = (e.target as HTMLInputElement).value}">
                        </wa-input>
                        <wa-input
                            label="Password"
                            type="password"
                            autocomplete="new-password"
                            required
                            minlength="6"
                            help-text="Use at least 6 characters."
                            password-toggle
                            value="${this.password}"
                            @wa-input="${(e: Event) => this.password = (e.target as HTMLInputElement).value}">
                        </wa-input>
                        <wa-input
                            label="Confirm password"
                            type="password"
                            autocomplete="new-password"
                            required
                            minlength="6"
                            password-toggle
                            value="${this.confirmPassword}"
                            @wa-input="${(e: Event) => this.confirmPassword = (e.target as HTMLInputElement).value}">
                        </wa-input>
                        <wa-button variant="primary" type="submit" pill ?loading="${this.isSubmitting}">
                            Register
                        </wa-button>
                    </form>
                    <p class="toggle-copy">
                        Already have an account?
                        <button class="link-button" type="button" @click="${() => this.switchMode("signin")}">Sign in</button>
                    </p>
                </wa-tab-panel>
            </wa-tab-group>
        `;
    }

    private renderAlert(): TemplateResult {
        if (this.error) {
            return html`
                <wa-alert variant="danger" open>
                    <wa-icon slot="icon" name="exclamation-circle-fill"></wa-icon>
                    ${this.error}
                </wa-alert>
            `;
        }

        if (this.success) {
            return html`
                <wa-alert variant="success" open>
                    <wa-icon slot="icon" name="check-lg"></wa-icon>
                    ${this.success}
                </wa-alert>
            `;
        }

        return html``;
    }

    private tabChanged(e: CustomEvent): void {
        const mode = e.detail.name as "signin" | "register";
        if (mode !== this.mode) {
            this.switchMode(mode);
        }
    }

    private switchMode(mode: "signin" | "register", clearMessages = true): void {
        this.mode = mode;
        if (clearMessages) {
            this.error = null;
            this.success = null;
        }
        (this.shadowRoot?.querySelector("wa-tab-group") as (Element & { show(panel: string): void }) | null)?.show(mode);
    }

    private async submitSignIn(e: Event): Promise<void> {
        e.preventDefault();
        this.error = null;
        this.success = null;
        this.isSubmitting = true;

        try {
            const result = await this.accountService.signIn({
                email: this.email.trim(),
                password: this.password,
                staySignedIn: this.staySignedIn
            });

            if (result.status === SignInStatus.Success) {
                this.user = result.user ?? await this.accountService.getUser();
                this.success = "You're signed in.";
                window.dispatchEvent(new CustomEvent("account-changed"));

                const redirectUrl = this.getRedirectUrl();
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
                return;
            }

            if (result.status === SignInStatus.RequiresVerification) {
                this.error = "Please check your email and confirm your email address before signing in. If you're still having trouble, please <a href='/contact'>contact us</a>.";
                return;
            }

            if (result.status === SignInStatus.LockedOut) {
                this.error = "This account is locked. Please try again later.";
                return;
            }

            this.error = result.errorMessage || "Bad user name or password.";
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to sign in.";
        } finally {
            this.isSubmitting = false;
        }
    }

    private async submitRegister(e: Event): Promise<void> {
        e.preventDefault();
        this.error = null;
        this.success = null;

        if (this.password !== this.confirmPassword) {
            this.error = "The password and confirmation password do not match.";
            return;
        }

        this.isSubmitting = true;
        try {
            const result = await this.accountService.register({
                email: this.email.trim(),
                password: this.password,
                confirmPassword: this.confirmPassword
            });

            if (result.success) {
                this.password = "";
                this.confirmPassword = "";
                this.switchMode("signin", false);
                this.success = "Please check your email and confirm your account before signing in.";
                return;
            }

            if (result.isAlreadyRegistered) {
                if (result.needsConfirmation) {
                    this.error = "You're already registered. Check your email to confirm your account before signing in.";
                } else {
                    this.error = "You're already registered. Please sign in.";
                }
                return;
            }

            this.error = result.errorMessage || "Unable to register.";
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to register.";
        } finally {
            this.isSubmitting = false;
        }
    }

    private getRedirectUrl(): string | null {
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        if (!redirect) {
            return null;
        }

        // Only allow local app-relative redirects.
        if (!redirect.startsWith("/") || redirect.startsWith("//")) {
            return null;
        }

        return redirect;
    }

    private async signOut(): Promise<void> {
        this.isSubmitting = true;
        try {
            await this.accountService.signOut();
            this.user = null;
            this.success = "You're signed out.";
            window.dispatchEvent(new CustomEvent("account-changed"));
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to sign out.";
        } finally {
            this.isSubmitting = false;
        }
    }
}
