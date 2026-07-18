import { css } from "lit";

export const profilePageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .profile-page {
        max-width: 640px;
        margin: 0 auto;
        padding: var(--wa-space-2xl) var(--wa-space-m);
    }

    .card {
        background: white;
        border: 1px solid var(--wa-color-neutral-80);
        border-radius: var(--wa-border-radius-l);
        box-shadow: var(--wa-shadow-m);
        padding: var(--wa-space-l);
        display: grid;
        gap: var(--wa-space-m);
    }

    h1 {
        margin: 0;
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
    }

    p {
        margin: 0;
        color: var(--wa-color-neutral-40);
    }

    form {
        display: grid;
        gap: var(--wa-space-m);
    }

    wa-callout {
        margin-bottom: var(--wa-space-s);
    }

    .label {
        color: var(--wa-color-neutral-50);
        font-size: 0.9rem;
        margin-bottom: var(--wa-space-3xs);
    }

    .value {
        color: var(--wa-color-neutral-10);
        font-weight: 600;
    }

    .actions {
        display: flex;
        gap: var(--wa-space-s);
        flex-wrap: wrap;
    }

    .profile-image-preview {
        margin-top: var(--wa-space-s);
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 999px;
        border: 2px solid var(--wa-color-neutral-80);
    }

    .chart-links {
        margin: var(--wa-space-2xs) 0 0;
        padding-left: var(--wa-space-l);
    }

    .chart-links a {
        color: var(--theme-color);
    }

    .empty-value {
        color: var(--wa-color-neutral-50);
        font-style: italic;
    }
`;