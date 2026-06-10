import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { UserViewModel } from "../models/account";
import { accountService } from "../services/account-service";
import { profilePageStyles } from "./profile-page.styles";

import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";

@customElement("profile-page")
export class ProfilePage extends LitElement {
    static styles = [profilePageStyles];

    @state() user: UserViewModel | null = null;
    @state() firstName = "";
    @state() lastName = "";
    @state() profilePictureUrl: string | null = null;
    @state() isSaving = false;
    @state() error: string | null = null;
    @state() success: string | null = null;

    private selectedProfilePictureFile: File | null = null;

    connectedCallback(): void {
        super.connectedCallback();
        accountService.getUser()
            .then(user => this.applyUser(user))
            .catch(() => this.user = null);
    }

    render(): TemplateResult {
        return html`
            <section class="profile-page">
                <div class="card">
                    <h1>My Profile</h1>
                    ${this.user ? this.renderSignedInProfile() : this.renderSignedOutProfile()}
                </div>
            </section>
        `;
    }

    private renderSignedInProfile(): TemplateResult {
        return html`
            ${this.renderAlert()}

            <form @submit="${this.saveProfile}">
                <div>
                    <div class="label">Email</div>
                    <div class="value">${this.user?.email || this.user?.userName || "Unknown"}</div>
                </div>

                <wa-input
                    label="First name"
                    value="${this.firstName}"
                    @wa-input="${(e: Event) => this.firstName = (e.target as HTMLInputElement).value}">
                </wa-input>

                <wa-input
                    label="Last name"
                    value="${this.lastName}"
                    @wa-input="${(e: Event) => this.lastName = (e.target as HTMLInputElement).value}">
                </wa-input>

                <wa-input
                    label="Registration date"
                    readonly
                    value="${this.formatDate(this.user?.registrationDate)}">
                </wa-input>

                <div>
                    <div class="label">Profile picture</div>
                    <input type="file" accept="image/*" @change="${this.onProfileImageChanged}" />
                    ${this.profilePictureUrl ? html`<img class="profile-image-preview" src="${this.profilePictureUrl}" alt="Profile picture preview" />` : html``}
                </div>

                ${this.renderChartLinkSection("Starred chord charts", this.user?.starredChordCharts)}
                ${this.renderChartLinkSection("Edited chord charts", this.user?.editedChordCharts)}
                ${this.renderChartLinkSection("New chord charts", this.user?.newChordCharts)}

                <div class="actions">
                    <wa-button variant="brand" type="submit" ?loading="${this.isSaving}">Save</wa-button>
                </div>
            </form>
        `;
    }

    private renderSignedOutProfile(): TemplateResult {
        return html`
            <p>You are not signed in.</p>
            <div class="actions">
                <wa-button variant="brand" href="/account">Sign In</wa-button>
                <wa-button variant="neutral" href="/account?mode=register">Register</wa-button>
            </div>
        `;
    }

    private renderAlert(): TemplateResult {
        if (this.error) {
            return html`
                <wa-callout variant="danger" open>
                    ${this.error}
                </wa-callout>
            `;
        }

        if (this.success) {
            return html`
                <wa-callout variant="success" open>
                    ${this.success}
                </wa-callout>
            `;
        }

        return html``;
    }

    private renderChartLinkSection(title: string, chordCharts?: Record<string, string>): TemplateResult {
        const entries = Object.entries(chordCharts ?? {});
        return html`
            <div>
                <div class="label">${title}</div>
                ${entries.length === 0 ? html`<p class="empty-value">None yet</p>` : html`
                        <ul class="chart-links">
                            ${entries.map(([id, name]) => html`<li><a href="${this.getChordLink(id)}">${name}</a></li>`)}
                        </ul>
                    `}
            </div>
        `;
    }

    private getChordLink(chartId: string): string {
        const relativeId = chartId.replace(/^chordsheets\//i, "");
        return `/chordsheets/${encodeURIComponent(relativeId)}`;
    }

    private formatDate(date?: string): string {
        if (!date) {
            return "";
        }

        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) {
            return "";
        }

        return parsed.toLocaleDateString();
    }

    private applyUser(user: UserViewModel | null): void {
        this.user = user;
        this.firstName = user?.firstName ?? "";
        this.lastName = user?.lastName ?? "";
        this.profilePictureUrl = user?.profilePictureUrl ?? null;
        this.selectedProfilePictureFile = null;
    }

    private async onProfileImageChanged(e: Event): Promise<void> {
        const files = (e.target as HTMLInputElement).files;
        const file = files?.[0];
        if (!file) {
            return;
        }

        this.error = null;
        this.success = null;
        this.selectedProfilePictureFile = file;
        this.profilePictureUrl = URL.createObjectURL(file);
    }

    private async saveProfile(e: Event): Promise<void> {
        e.preventDefault();
        this.error = null;
        this.success = null;

        if (!this.user?.id) {
            this.error = "Unable to save profile because your account could not be identified.";
            return;
        }

        this.isSaving = true;
        try {
            const updatedUser = await accountService.saveProfile({
                ...this.user,
                firstName: this.firstName,
                lastName: this.lastName
            }, this.selectedProfilePictureFile);

            this.applyUser(updatedUser);
            this.success = "Profile saved.";
            window.dispatchEvent(new CustomEvent("account-changed"));
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to save profile.";
        } finally {
            this.isSaving = false;
        }
    }
}

