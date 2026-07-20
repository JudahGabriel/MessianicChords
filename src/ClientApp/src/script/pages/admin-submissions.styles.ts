import { css } from "lit";

export const adminSubmissionsStyles = css`
    :host {
        display: block;
        padding: 20px;
    }

    .admin-page {
        max-width: 1200px;
        margin: 0 auto;
    }

    .submission-card {
        border: 1px solid var(--app-border);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        background: var(--app-surface);
    }

    .submission-card.is-edit {
        border-left: 4px solid var(--wa-color-brand-40, #7f80b6);
    }

    .submission-card.is-new {
        border-left: 4px solid #28a745;
    }

    .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .submission-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0;
    }

    .submission-badge {
        display: inline-block;
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .badge-new {
        background: #d4edda;
        color: #155724;
    }

    .badge-edit {
        background: #e8e6f0;
        color: #35338c;
    }

    .editing-info {
        font-size: 0.9rem;
        color: var(--app-text-muted);
        margin: 0 0 12px 0;
    }

    .editing-info a {
        color: var(--wa-color-brand-30, #6665a8);
    }

    .submission-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px 24px;
        margin-bottom: 16px;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
    }

    .detail-label {
        font-size: 0.8rem;
        color: var(--app-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .detail-value {
        font-size: 0.95rem;
    }

    /* Diff table styles */
    .diff-section-title {
        font-size: 0.95rem;
        font-weight: 600;
        margin: 16px 0 8px 0;
        color: var(--app-text);
    }

    .diff-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
        font-size: 0.9rem;
    }

    .diff-table th {
        text-align: left;
        padding: 8px 12px;
        background: var(--wa-color-neutral-fill-normal);
        border-bottom: 2px solid var(--wa-color-neutral-border-normal);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--wa-color-neutral-on-normal);
    }

    .diff-table td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--app-border);
        vertical-align: top;
    }

    .diff-field-name {
        font-weight: 600;
        white-space: nowrap;
        width: 120px;
    }

    .diff-new {
        background: var(--wa-color-success-fill-quiet);
        color: var(--wa-color-success-on-quiet);
    }

    .diff-old {
        background: var(--wa-color-warning-fill-quiet);
        color: var(--wa-color-warning-on-quiet);
    }

    .empty-val {
        color: #aaa;
        font-style: italic;
    }

    .chords-diff {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
    }

    .chords-diff-panel {
        display: flex;
        flex-direction: column;
    }

    .chords-diff-label {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-text-muted);
        margin-bottom: 4px;
    }

    .chords-preview {
        max-height: 200px;
        overflow-y: auto;
        background: var(--wa-color-success-fill-quiet);
        border: 1px solid var(--wa-color-success-border-normal);
        border-radius: 4px;
        padding: 12px;
        font-family: monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        flex: 1;
        color: var(--wa-color-success-on-quiet);
    }

    .chords-old {
        background: var(--wa-color-warning-fill-quiet);
        border-color: var(--wa-color-warning-border-normal);
        color: var(--wa-color-warning-on-quiet);
    }

    .links-diff {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
    }

    .no-changes {
        color: var(--app-text-muted);
        font-style: italic;
        margin: 8px 0 16px 0;
    }

    .unchanged-details {
        margin-bottom: 16px;
    }

    .unchanged-details summary {
        cursor: pointer;
        color: var(--app-text-muted);
        font-size: 0.85rem;
        margin-bottom: 8px;
    }

    .unchanged-details summary:hover {
        color: #555;
    }

    .attachments-list {
        list-style: none;
        padding: 0;
        margin: 0 0 16px 0;
    }

    .attachments-list li {
        margin-bottom: 4px;
    }

    .attachments-list a {
        color: var(--wa-color-brand-30, #6665a8);
    }

    .submission-actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--app-text-muted);
    }

    .empty-state wa-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        display: block;
    }

    .error-alert {
        margin-bottom: 16px;
    }

    .submitted-date {
        font-size: 0.85rem;
        color: var(--app-text-muted);
    }

    @media (max-width: 600px) {
        .chords-diff,
        .links-diff {
            grid-template-columns: 1fr;
        }
    }
`;
