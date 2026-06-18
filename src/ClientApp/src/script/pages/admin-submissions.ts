import { html, LitElement, TemplateResult, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../common/shared.styles";
import { adminSubmissionsStyles } from "./admin-submissions.styles";
import { ChordSubmission } from "../models/chord-submission";
import { adminService } from "../services/admin-service";
import { accountService } from "../services/account-service";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";

@customElement("admin-submissions")
export class AdminSubmissions extends LitElement {
    static styles = [sharedStyles, adminSubmissionsStyles];

    @state() submissions: ChordSubmission[] = [];
    @state() isLoading = true;
    @state() error: string | null = null;
    @state() processingIds: Set<string> = new Set();
    @state() isAdmin = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.checkAdminAndLoad();
    }

    private async checkAdminAndLoad(): Promise<void> {
        try {
            const user = await accountService.getUser();
            if (!user?.isAdmin) {
                this.isAdmin = false;
                this.isLoading = false;
                return;
            }
            this.isAdmin = true;
            await this.loadSubmissions();
        } catch {
            this.error = "Failed to verify admin access.";
            this.isLoading = false;
        }
    }

    private async loadSubmissions(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            this.submissions = await adminService.getPendingSubmissions();
        } catch {
            this.error = "Failed to load submissions.";
        } finally {
            this.isLoading = false;
        }
    }

    render(): TemplateResult {
        return html`
            <div class="admin-page">
                <h2 class="highlight">Pending Submissions</h2>

                ${this.error ? html`
                    <sl-alert variant="danger" open class="error-alert">
                        ${this.error}
                    </sl-alert>
                ` : nothing}

                ${this.renderContent()}
            </div>
        `;
    }

    private renderContent(): TemplateResult | typeof nothing {
        if (!this.isAdmin && !this.isLoading) {
            return html`
                <div class="empty-state">
                    <p>You must be signed in as an admin to access this page.</p>
                    <sl-button variant="primary" href="/account">Sign In</sl-button>
                </div>
            `;
        }

        if (this.isLoading) {
            return html`
                <div class="empty-state">
                    <sl-spinner style="font-size: 2rem;"></sl-spinner>
                    <p>Loading submissions...</p>
                </div>
            `;
        }

        if (this.submissions.length === 0) {
            return html`
                <div class="empty-state">
                    <p>🎉 No pending submissions. All caught up!</p>
                </div>
            `;
        }

        return html`
            <p>${this.submissions.length} pending submission${this.submissions.length === 1 ? "" : "s"}</p>
            ${this.submissions.map(s => this.renderSubmission(s))}
        `;
    }

    private renderSubmission(submission: ChordSubmission): TemplateResult {
        const isNew = !submission.editedChordSheetId;
        const isProcessing = this.processingIds.has(submission.id);

        return html`
            <div class="submission-card ${isNew ? "is-new" : "is-edit"}">
                <div class="submission-header">
                    <div>
                        <h3 class="submission-title">${submission.artist} - ${submission.song}${submission.hebrewSongName ? ` ${submission.hebrewSongName}` : ""}</h3>
                        <span class="submitted-date">Submitted ${this.formatDate(submission.created)}</span>
                    </div>
                    <span class="submission-badge ${isNew ? "badge-new" : "badge-edit"}">
                        ${isNew ? "New" : "Edit"}
                    </span>
                </div>

                <div class="submission-details">
                    ${submission.key ? html`
                        <div class="detail-item">
                            <span class="detail-label">Key</span>
                            <span class="detail-value">${submission.key}</span>
                        </div>
                    ` : nothing}
                    ${submission.capo ? html`
                        <div class="detail-item">
                            <span class="detail-label">Capo</span>
                            <span class="detail-value">${submission.capo}</span>
                        </div>
                    ` : nothing}
                    ${submission.authors.length > 0 ? html`
                        <div class="detail-item">
                            <span class="detail-label">Authors</span>
                            <span class="detail-value">${submission.authors.join(", ")}</span>
                        </div>
                    ` : nothing}
                    ${submission.copyright ? html`
                        <div class="detail-item">
                            <span class="detail-label">Copyright</span>
                            <span class="detail-value">${submission.copyright}</span>
                        </div>
                    ` : nothing}
                    ${submission.scripture ? html`
                        <div class="detail-item">
                            <span class="detail-label">Scripture</span>
                            <span class="detail-value">${submission.scripture}</span>
                        </div>
                    ` : nothing}
                    ${submission.year ? html`
                        <div class="detail-item">
                            <span class="detail-label">Year</span>
                            <span class="detail-value">${submission.year}</span>
                        </div>
                    ` : nothing}
                    ${submission.isSheetMusic ? html`
                        <div class="detail-item">
                            <span class="detail-label">Sheet Music</span>
                            <span class="detail-value">Yes</span>
                        </div>
                    ` : nothing}
                    ${!isNew ? html`
                        <div class="detail-item">
                            <span class="detail-label">Editing</span>
                            <span class="detail-value">
                                <a href="/chordsheets/${encodeURIComponent(submission.editedChordSheetId!.replace(/^ChordSheets\//i, ""))}">${submission.editedChordSheetId}</a>
                            </span>
                        </div>
                    ` : nothing}
                </div>

                ${submission.chords ? html`
                    <div class="chords-preview">${submission.chords}</div>
                ` : nothing}

                ${submission.savedAttachments.length > 0 ? html`
                    <ul class="attachments-list">
                        ${submission.savedAttachments.map(a => html`
                            <li>📎 <a href="${a.cdnUri}" target="_blank">${a.untrustedFileName}</a></li>
                        `)}
                    </ul>
                ` : nothing}

                ${submission.links.length > 0 ? html`
                    <div class="detail-item" style="margin-bottom: 16px;">
                        <span class="detail-label">Links</span>
                        ${submission.links.map(link => html`<a href="${link}" target="_blank" style="display:block; font-size: 0.9rem;">${link}</a>`)}
                    </div>
                ` : nothing}

                <div class="submission-actions">
                    <sl-button
                        variant="success"
                        ?loading="${isProcessing}"
                        ?disabled="${isProcessing}"
                        @click="${() => this.approve(submission)}">
                        ✅ Approve
                    </sl-button>
                    <sl-button
                        variant="danger"
                        ?loading="${isProcessing}"
                        ?disabled="${isProcessing}"
                        @click="${() => this.reject(submission)}">
                        ❌ Reject
                    </sl-button>
                </div>
            </div>
        `;
    }

    private async approve(submission: ChordSubmission): Promise<void> {
        if (!submission.id) return;
        await this.processSubmission(submission.id, () => adminService.approveSubmission(submission.id));
    }

    private async reject(submission: ChordSubmission): Promise<void> {
        if (!submission.id) return;
        await this.processSubmission(submission.id, () => adminService.rejectSubmission(submission.id));
    }

    private async processSubmission(submissionId: string, action: () => Promise<unknown>): Promise<void> {
        this.processingIds = new Set([...this.processingIds, submissionId]);
        this.error = null;
        try {
            await action();
            this.submissions = this.submissions.filter(s => s.id !== submissionId);
        } catch {
            this.error = `Failed to process submission ${submissionId}.`;
        } finally {
            const newSet = new Set(this.processingIds);
            newSet.delete(submissionId);
            this.processingIds = newSet;
        }
    }

    private formatDate(date?: string): string {
        if (!date) return "";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "";
        return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
}
