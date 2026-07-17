import { html, LitElement, TemplateResult, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../common/shared.styles";
import { adminSubmissionsStyles } from "./admin-submissions.styles";
import { ChordSubmission, PendingChordSubmission } from "../models/chord-submission";
import { ChordSheet } from "../models/interfaces";
import { adminService } from "../services/admin-service";
import { accountService } from "../services/account-service";

import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

@customElement("admin-submissions")
export class AdminSubmissions extends LitElement {
    static styles = [sharedStyles, adminSubmissionsStyles];

    @state() pendingSubmissions: PendingChordSubmission[] = [];
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
            this.pendingSubmissions = await adminService.getPendingSubmissions();
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
                    <wa-callout variant="danger" class="error-alert">
                        ${this.error}
                    </wa-callout>
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
                    <wa-button variant="brand" href="/account">Sign In</wa-button>
                </div>
            `;
        }

        if (this.isLoading) {
            return html`
                <div class="empty-state">
                    <wa-spinner style="font-size: 2rem;"></wa-spinner>
                    <p>Loading submissions...</p>
                </div>
            `;
        }

        if (this.pendingSubmissions.length === 0) {
            return html`
                <div class="empty-state">
                    <p>🎉 No pending submissions. All caught up!</p>
                </div>
            `;
        }

        return html`
            <p>${this.pendingSubmissions.length} pending submission${this.pendingSubmissions.length === 1 ? "" : "s"}</p>
            ${this.pendingSubmissions.map(p => this.renderSubmission(p))}
        `;
    }

    private renderSubmission(pending: PendingChordSubmission): TemplateResult {
        const { submission, original } = pending;
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
                        ${isNew ? "🆕 New Chart" : "✏️ Edit"}
                    </span>
                </div>

                ${!isNew && original ? html`
                    <p class="editing-info">
                        Editing <a href="/chordsheets/${encodeURIComponent(submission.editedChordSheetId!.replace(/^ChordSheets\//i, ""))}">${original.artist} - ${original.song}</a>
                    </p>
                ` : nothing}

                ${isNew ? this.renderNewSubmissionDetails(submission) : this.renderEditDiff(submission, original)}

                ${submission.savedAttachments.length > 0 ? html`
                    <ul class="attachments-list">
                        ${submission.savedAttachments.map(a => html`
                            <li><wa-icon name="paperclip"></wa-icon> <a href="${a.cdnUri}" target="_blank">${a.untrustedFileName}</a></li>
                        `)}
                    </ul>
                ` : nothing}

                <div class="submission-actions">
                    <wa-button
                        variant="success"
                        ?loading="${isProcessing}"
                        ?disabled="${isProcessing}"
                        @click="${() => this.approve(submission)}">
                        ✅ Approve
                    </wa-button>
                    <wa-button
                        variant="danger"
                        ?loading="${isProcessing}"
                        ?disabled="${isProcessing}"
                        @click="${() => this.reject(submission)}">
                        ❌ Reject
                    </wa-button>
                </div>
            </div>
        `;
    }

    private renderNewSubmissionDetails(submission: ChordSubmission): TemplateResult {
        return html`
            <div class="submission-details">
                ${this.renderDetailIfPresent("Song", submission.song)}
                ${this.renderDetailIfPresent("Hebrew Name", submission.hebrewSongName)}
                ${this.renderDetailIfPresent("Artist", submission.artist)}
                ${this.renderDetailIfPresent("Key", submission.key)}
                ${submission.capo ? this.renderDetailIfPresent("Capo", String(submission.capo)) : nothing}
                ${submission.authors.length > 0 ? this.renderDetailIfPresent("Authors", submission.authors.join(", ")) : nothing}
                ${this.renderDetailIfPresent("Copyright", submission.copyright)}
                ${this.renderDetailIfPresent("Scripture", submission.scripture)}
                ${submission.year ? this.renderDetailIfPresent("Year", String(submission.year)) : nothing}
                ${submission.isSheetMusic ? this.renderDetailIfPresent("Sheet Music", "Yes") : nothing}
                ${this.renderDetailIfPresent("About", submission.about)}
            </div>

            ${submission.chords ? html`
                <div class="chords-preview">${submission.chords}</div>
            ` : nothing}

            ${submission.links.length > 0 ? html`
                <div class="detail-item" style="margin-bottom: 16px;">
                    <span class="detail-label">Links</span>
                    ${submission.links.map(link => html`<a href="${link}" target="_blank" style="display:block; font-size: 0.9rem;">${link}</a>`)}
                </div>
            ` : nothing}
        `;
    }

    private renderEditDiff(submission: ChordSubmission, original: ChordSheet | null): TemplateResult {
        if (!original) {
            return this.renderNewSubmissionDetails(submission);
        }

        const fields: Array<{ label: string; newVal: string; oldVal: string }> = [
            { label: "Song", newVal: submission.song ?? "", oldVal: original.song ?? "" },
            { label: "Hebrew Name", newVal: submission.hebrewSongName ?? "", oldVal: original.hebrewSongName ?? "" },
            { label: "Artist", newVal: submission.artist ?? "", oldVal: original.artist ?? "" },
            { label: "Key", newVal: submission.key ?? "", oldVal: original.key ?? "" },
            { label: "Capo", newVal: submission.capo ? String(submission.capo) : "", oldVal: original.capo ? String(original.capo) : "" },
            { label: "Authors", newVal: (submission.authors ?? []).join(", "), oldVal: (original.authors ?? []).join(", ") },
            { label: "Copyright", newVal: submission.copyright ?? "", oldVal: original.copyright ?? "" },
            { label: "Scripture", newVal: submission.scripture ?? "", oldVal: original.scripture ?? "" },
            { label: "Year", newVal: submission.year ? String(submission.year) : "", oldVal: original.year ? String(original.year) : "" },
            { label: "Sheet Music", newVal: submission.isSheetMusic ? "Yes" : "No", oldVal: original.isSheetMusic ? "Yes" : "No" },
            { label: "About", newVal: submission.about ?? "", oldVal: original.about ?? "" },
        ];

        const changedFields = fields.filter(f => f.newVal !== f.oldVal);
        const unchangedFields = fields.filter(f => f.newVal !== "" && f.newVal === f.oldVal);

        const chordsChanged = (submission.chords ?? "") !== (original.chords ?? "");
        const linksChanged = JSON.stringify(submission.links ?? []) !== JSON.stringify(original.links ?? []);

        return html`
            ${changedFields.length > 0 ? html`
                <h4 class="diff-section-title">Changed Fields</h4>
                <table class="diff-table">
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>New Value</th>
                            <th>Old Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${changedFields.map(f => html`
                            <tr class="diff-changed">
                                <td class="diff-field-name">${f.label}</td>
                                <td class="diff-new">${f.newVal || html`<span class="empty-val">(empty)</span>`}</td>
                                <td class="diff-old">${f.oldVal || html`<span class="empty-val">(empty)</span>`}</td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            ` : nothing}

            ${chordsChanged ? html`
                <h4 class="diff-section-title">Chords Changed</h4>
                <div class="chords-diff">
                    <div class="chords-diff-panel">
                        <div class="chords-diff-label">New</div>
                        <div class="chords-preview">${submission.chords || "(empty)"}</div>
                    </div>
                    <div class="chords-diff-panel">
                        <div class="chords-diff-label">Old</div>
                        <div class="chords-preview chords-old">${original.chords || "(empty)"}</div>
                    </div>
                </div>
            ` : nothing}

            ${linksChanged ? html`
                <h4 class="diff-section-title">Links Changed</h4>
                <div class="links-diff">
                    <div>
                        <span class="detail-label">New</span>
                        ${(submission.links ?? []).map(link => html`<a href="${link}" target="_blank" style="display:block; font-size: 0.9rem;">${link}</a>`)}
                    </div>
                    <div>
                        <span class="detail-label">Old</span>
                        ${(original.links ?? []).map(link => html`<a href="${link}" target="_blank" style="display:block; font-size: 0.9rem;">${link}</a>`)}
                    </div>
                </div>
            ` : nothing}

            ${changedFields.length === 0 && !chordsChanged && !linksChanged ? html`
                <p class="no-changes">No field changes detected (only new attachments).</p>
            ` : nothing}

            ${unchangedFields.length > 0 ? html`
                <details class="unchanged-details">
                    <summary>Unchanged fields (${unchangedFields.length})</summary>
                    <div class="submission-details">
                        ${unchangedFields.map(f => this.renderDetailIfPresent(f.label, f.newVal))}
                    </div>
                </details>
            ` : nothing}
        `;
    }

    private renderDetailIfPresent(label: string, value: string | null | undefined): TemplateResult | typeof nothing {
        if (!value) return nothing;
        return html`
            <div class="detail-item">
                <span class="detail-label">${label}</span>
                <span class="detail-value">${value}</span>
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
            this.pendingSubmissions = this.pendingSubmissions.filter(p => p.submission.id !== submissionId);
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
