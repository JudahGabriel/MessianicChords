import { css } from "lit";

export const chordEditStyles = css`
    :host {
        font-family: var(--subtitle-font);
    }

    .page-heading-row {
        max-width: 900px;
        margin: 0 auto var(--sl-spacing-large);
    }

    .page-heading {
        display: inline-flex;
        align-items: center;
        gap: var(--sl-spacing-x-small);
        margin: 0;
    }

    .page-heading-icon {
        font-size: 0.95em;
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

    .form-group > label {
        display: block;
        margin-bottom: var(--sl-spacing-x-small);
    }

    .help-text {
        font-size: var(--sl-font-size-small);
        color: var(--sl-color-neutral-500);
        margin-top: var(--sl-spacing-x-small);
    }

    .attachment-picker-row {
        margin-top: var(--sl-spacing-2x-small);
    }

    #chord-chart-input::part(textarea) {
        height: 11in;
    }

    .chord-chart-text {
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

    .hidden-file-input {
        display: none;
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