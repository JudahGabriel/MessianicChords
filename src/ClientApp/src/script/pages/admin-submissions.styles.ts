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
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        background: #fafafa;
    }

    .submission-card.is-edit {
        border-left: 4px solid var(--sl-color-primary-600, #7f80b6);
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
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .badge-new {
        background: #d4edda;
        color: #155724;
    }

    .badge-edit {
        background: #e8e6f0;
        color: #35338c;
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
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .detail-value {
        font-size: 0.95rem;
    }

    .chords-preview {
        max-height: 200px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        font-family: monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        margin-bottom: 16px;
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
        color: var(--sl-color-primary-700, #6665a8);
    }

    .submission-actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
    }

    .empty-state sl-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        display: block;
    }

    .error-alert {
        margin-bottom: 16px;
    }

    .submitted-date {
        font-size: 0.85rem;
        color: #888;
    }
`;
