import { css } from "lit";

export const profilePageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .profile-page {
        max-width: 640px;
        margin: 0 auto;
        padding: var(--sl-spacing-2x-large) var(--sl-spacing-medium);
    }

    .card {
        background: white;
        border: 1px solid var(--sl-color-neutral-200);
        border-radius: var(--sl-border-radius-large);
        box-shadow: var(--sl-shadow-medium);
        padding: var(--sl-spacing-large);
        display: grid;
        gap: var(--sl-spacing-medium);
    }

    h1 {
        margin: 0;
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
    }

    p {
        margin: 0;
        color: var(--sl-color-neutral-600);
    }

    form {
        display: grid;
        gap: var(--sl-spacing-medium);
    }

    sl-alert {
        margin-bottom: var(--sl-spacing-small);
    }

    .label {
        color: var(--sl-color-neutral-500);
        font-size: 0.9rem;
        margin-bottom: var(--sl-spacing-3x-small);
    }

    .value {
        color: var(--sl-color-neutral-900);
        font-weight: 600;
    }

    .actions {
        display: flex;
        gap: var(--sl-spacing-small);
        flex-wrap: wrap;
    }

    .profile-image-preview {
        margin-top: var(--sl-spacing-small);
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 999px;
        border: 2px solid var(--sl-color-neutral-200);
    }

    .chart-links {
        margin: var(--sl-spacing-2x-small) 0 0;
        padding-left: var(--sl-spacing-large);
    }

    .chart-links a {
        color: var(--theme-color);
    }

    .empty-value {
        color: var(--sl-color-neutral-500);
        font-style: italic;
    }
`;