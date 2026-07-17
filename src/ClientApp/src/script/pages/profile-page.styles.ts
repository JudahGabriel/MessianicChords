import { css } from "lit";

export const profilePageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .profile-page {
        max-width: 640px;
        margin: 0 auto;
        padding: var(--wa-spacing-2x-large) var(--wa-spacing-medium);
    }

    .card {
        background: white;
        border: 1px solid var(--wa-color-neutral-200);
        border-radius: var(--wa-border-radius-large);
        box-shadow: var(--wa-shadow-medium);
        padding: var(--wa-spacing-large);
        display: grid;
        gap: var(--wa-spacing-medium);
    }

    h1 {
        margin: 0;
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
    }

    p {
        margin: 0;
        color: var(--wa-color-neutral-600);
    }

    form {
        display: grid;
        gap: var(--wa-spacing-medium);
    }

    wa-callout {
        margin-bottom: var(--wa-spacing-small);
    }

    .label {
        color: var(--wa-color-neutral-500);
        font-size: 0.9rem;
        margin-bottom: var(--wa-spacing-3x-small);
    }

    .value {
        color: var(--wa-color-neutral-900);
        font-weight: 600;
    }

    .actions {
        display: flex;
        gap: var(--wa-spacing-small);
        flex-wrap: wrap;
    }

    .profile-image-preview {
        margin-top: var(--wa-spacing-small);
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 999px;
        border: 2px solid var(--wa-color-neutral-200);
    }

    .chart-links {
        margin: var(--wa-spacing-2x-small) 0 0;
        padding-left: var(--wa-spacing-large);
    }

    .chart-links a {
        color: var(--theme-color);
    }

    .empty-value {
        color: var(--wa-color-neutral-500);
        font-style: italic;
    }
`;