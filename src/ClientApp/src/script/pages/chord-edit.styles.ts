import { css } from "lit";

export const chordEditStyles = css`
    :host {
        font-family: var(--subtitle-font);
    }

    .page-heading-row {
        max-width: 900px;
        margin: 0 auto var(--wa-space-l);
    }

    .page-heading {
        display: inline-flex;
        align-items: center;
        gap: var(--wa-space-xs);
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
        gap: var(--wa-space-m);
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
        margin-bottom: var(--wa-space-m);
    }

    .form-group > label {
        display: block;
        margin-bottom: var(--wa-space-xs);
    }

    .help-text {
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-neutral-50);
        margin-top: var(--wa-space-xs);
    }

    .attachment-picker-row {
        margin-top: var(--wa-space-2xs);
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
        margin-top: var(--wa-space-s);
    }

    .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--wa-space-s) var(--wa-space-m);
        border: 1px solid var(--wa-color-neutral-80);
        border-radius: var(--wa-border-radius-m);
        margin-bottom: var(--wa-space-xs);
    }

    .attachment-item-error {
        border-color: var(--wa-color-danger-50);
        background: var(--wa-color-danger-95);
    }

    .text-break {
        word-break: break-all;
    }

    .size-label {
        color: var(--wa-color-neutral-50);
        font-size: var(--wa-font-size-s);
    }

    .hidden-file-input {
        display: none;
    }

    .loading-skeleton {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--wa-space-m);
        max-width: 600px;
        margin: 0 auto;
    }

    wa-button[variant="brand"] {
        width: 100%;
    }
`;