import { css } from "lit";

export const chordEditStyles = css`
    :host {
        font-family: var(--subtitle-font);
    }

    form {
        max-width: 900px;
        margin: 0 auto;
    }

    .form-row {
        display: grid;
        gap: var(--sl-spacing-medium);
    }

    .form-row-2 {
        grid-template-columns: 1fr 1fr;
    }

    .form-row-3 {
        grid-template-columns: 1fr 1fr 1fr;
    }

    @media (max-width: 768px) {
        .form-row-2, .form-row-3 {
            grid-template-columns: 1fr;
        }
    }

    .form-group {
        margin-bottom: var(--sl-spacing-medium);
    }

    .help-text {
        font-size: var(--sl-font-size-small);
        color: var(--sl-color-neutral-500);
        margin-top: var(--sl-spacing-x-small);
    }

    .chord-chart-text {
        --height: 9in;
        font-family: monospace;
    }

    .chord-chart-text::part(textarea) {
        white-space: pre;
        font-family: monospace;
        font-size: 16px;
    }

    .attachment-list {
        list-style: none;
        padding: 0;
        margin-top: var(--sl-spacing-small);
    }

    .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--sl-spacing-small) var(--sl-spacing-medium);
        border: 1px solid var(--sl-color-neutral-200);
        border-radius: var(--sl-border-radius-medium);
        margin-bottom: var(--sl-spacing-x-small);
    }

    .attachment-item-error {
        border-color: var(--sl-color-danger-500);
        background: var(--sl-color-danger-50);
    }

    .text-break {
        word-break: break-all;
    }

    .size-label {
        color: var(--sl-color-neutral-500);
        font-size: var(--sl-font-size-small);
    }

    input[type="file"] {
        display: block;
        width: 100%;
        padding: var(--sl-spacing-small);
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-medium);
        font-size: var(--sl-font-size-medium);
    }

    .loading-skeleton {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--sl-spacing-medium);
        max-width: 600px;
        margin: 0 auto;
    }

    sl-button[variant="primary"] {
        width: 100%;
    }
`;