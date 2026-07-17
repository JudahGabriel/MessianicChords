import { css } from "lit";

export const contactPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .contact-page {
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
    }

    h1 {
        margin: 0 0 var(--wa-spacing-small);
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
        text-align: center;
    }

    .intro {
        margin: 0 0 var(--wa-spacing-large);
        color: var(--wa-color-neutral-600);
        text-align: center;
    }

    form {
        display: grid;
        gap: var(--wa-spacing-medium);
    }

    wa-callout {
        margin-bottom: var(--wa-spacing-medium);
    }

    wa-button[type="submit"] {
        width: 100%;
    }
`;