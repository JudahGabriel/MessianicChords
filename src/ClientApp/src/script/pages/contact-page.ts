import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SupportMessage } from "../models/account";
import { accountService } from "../services/account-service";
import { contactPageStyles } from "./contact-page.styles";

import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";

@customElement("contact-page")
export class ContactPage extends LitElement {
    static styles = [contactPageStyles];

    @state() email = "";
    @state() message = "";
    @state() isSubmitting = false;
    @state() error: string | null = null;
    @state() success: string | null = null;

    private readonly accountService = accountService;

    render(): TemplateResult {
        return html`
            <section class="contact-page">
                <div class="card">
                    <h1>Contact Us</h1>
                    <p class="intro">Need help or want to share feedback? Send us a message.</p>

                    ${this.renderAlert()}

                    <form @submit="${this.submit}">
                        <wa-input
                            label="Email"
                            type="email"
                            autocomplete="email"
                            required
                            value="${this.email}"
                            @wa-input="${(e: Event) => this.email = (e.target as HTMLInputElement).value}">
                        </wa-input>

                        <wa-textarea
                            label="Message"
                            rows="7"
                            resize="auto"
                            required
                            value="${this.message}"
                            @wa-input="${(e: Event) => this.message = (e.target as HTMLTextAreaElement).value}">
                        </wa-textarea>

                        <wa-button variant="brand" type="submit" pill ?loading="${this.isSubmitting}">
                            Submit
                        </wa-button>
                    </form>
                </div>
            </section>
        `;
    }

    private renderAlert(): TemplateResult {
        if (this.error) {
            return html`
                <wa-callout variant="danger" open>
                    <wa-icon slot="icon" name="exclamation-circle-fill"></wa-icon>
                    ${this.error}
                </wa-callout>
            `;
        }

        if (this.success) {
            return html`
                <wa-callout variant="success" open>
                    <wa-icon slot="icon" name="check-lg"></wa-icon>
                    ${this.success}
                </wa-callout>
            `;
        }

        return html``;
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        this.error = null;
        this.success = null;

        const email = this.email.trim();
        const message = this.message.trim();

        if (!email) {
            this.error = "Email is required.";
            return;
        }

        if (!message) {
            this.error = "Message is required.";
            return;
        }

        this.isSubmitting = true;
        try {
            const supportMessage: SupportMessage = {
                email,
                message,
                date: new Date().toISOString(),
                userAgent: navigator.userAgent
            };

            await this.accountService.sendSupportMessage(supportMessage);
            this.message = "";
            this.success = "Thanks for reaching out. Your message has been sent.";
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to send support message.";
        } finally {
            this.isSubmitting = false;
        }
    }
}

