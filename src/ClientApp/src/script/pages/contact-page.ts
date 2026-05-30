import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SupportMessage } from "../models/account";
import { accountService } from "../services/account-service";
import { contactPageStyles } from "./contact-page.styles";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";

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
                        <sl-input
                            label="Email"
                            type="email"
                            autocomplete="email"
                            required
                            value="${this.email}"
                            @sl-input="${(e: Event) => this.email = (e.target as HTMLInputElement).value}">
                        </sl-input>

                        <sl-textarea
                            label="Message"
                            rows="7"
                            resize="auto"
                            required
                            value="${this.message}"
                            @sl-input="${(e: Event) => this.message = (e.target as HTMLTextAreaElement).value}">
                        </sl-textarea>

                        <sl-button variant="primary" type="submit" pill ?loading="${this.isSubmitting}">
                            Submit
                        </sl-button>
                    </form>
                </div>
            </section>
        `;
    }

    private renderAlert(): TemplateResult {
        if (this.error) {
            return html`
                <sl-alert variant="danger" open>
                    <sl-icon slot="icon" name="exclamation-circle-fill"></sl-icon>
                    ${this.error}
                </sl-alert>
            `;
        }

        if (this.success) {
            return html`
                <sl-alert variant="success" open>
                    <sl-icon slot="icon" name="check-lg"></sl-icon>
                    ${this.success}
                </sl-alert>
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