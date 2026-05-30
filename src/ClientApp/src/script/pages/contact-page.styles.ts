import { css } from "lit";

export const contactPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .contact-page {
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
    }

    h1 {
        margin: 0 0 var(--sl-spacing-small);
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
        text-align: center;
    }

    .intro {
        margin: 0 0 var(--sl-spacing-large);
        color: var(--sl-color-neutral-600);
        text-align: center;
    }

    form {
        display: grid;
        gap: var(--sl-spacing-medium);
    }

    sl-alert {
        margin-bottom: var(--sl-spacing-medium);
    }

    sl-button[type="submit"] {
        width: 100%;
    }
`;