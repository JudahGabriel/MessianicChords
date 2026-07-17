import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../common/shared.styles";
import { accountService } from "../services/account-service";

import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

@customElement("confirm-email-page")
export class ConfirmEmailPage extends LitElement {
    static styles = [sharedStyles, css`
        :host {
            display: block;
            font-family: var(--subtitle-font);
        }

        .page {
            display: grid;
            min-height: 60vh;
            padding: var(--wa-spacing-2x-large) var(--wa-spacing-medium);
            place-items: center;
        }

        .card {
            background: white;
            border: 1px solid var(--wa-color-neutral-200);
            border-radius: var(--wa-border-radius-large);
            box-shadow: var(--wa-shadow-medium);
            max-width: 520px;
            padding: var(--wa-spacing-x-large);
            text-align: center;
        }

        h1 {
            color: var(--theme-color);
            font-family: var(--title-font);
            margin-top: 0;
        }

        p {
            color: var(--wa-color-neutral-700);
            line-height: 1.5;
        }

        wa-spinner {
            font-size: 2rem;
        }
    `];

    @state() private status: "confirming" | "success" | "error" = "confirming";
    @state() private errorMessage = "";

    connectedCallback(): void {
        super.connectedCallback();
        void this.confirmEmail();
    }

    render(): TemplateResult {
        return html`
            <main class="page">
                <section class="card" aria-live="polite">
                    ${this.renderStatus()}
                </section>
            </main>
        `;
    }

    private renderStatus(): TemplateResult {
        if (this.status === "confirming") {
            return html`
                <wa-spinner></wa-spinner>
                <h1>Confirming your email</h1>
                <p>Please wait while we confirm your account.</p>
            `;
        }

        if (this.status === "success") {
            return html`
                <h1>Email confirmed</h1>
                <p>Your account is confirmed. You can now sign in.</p>
                <wa-button variant="brand" pill href="/account?mode=signin">Sign in</wa-button>
            `;
        }

        return html`
            <h1>Unable to confirm email</h1>
            <p>${this.errorMessage}</p>
            <wa-button variant="brand" pill href="/contact">Contact us</wa-button>
        `;
    }

    private async confirmEmail(): Promise<void> {
        const query = new URLSearchParams(window.location.search);
        const email = query.get("email");
        const token = query.get("token");
        if (!email || !token) {
            this.status = "error";
            this.errorMessage = "This confirmation link is incomplete. Please use the full link from your email.";
            return;
        }

        try {
            const result = await accountService.confirmEmail(email, token);
            if (result.success) {
                this.status = "success";
                return;
            }

            this.status = "error";
            this.errorMessage = result.errorMessage || "This confirmation link is invalid or has expired.";
        } catch {
            this.status = "error";
            this.errorMessage = "We couldn't confirm your email right now. Please try again later.";
        }
    }
}
