import { css } from "lit";

export const contactPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .contact-page {
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
    }

    h1 {
        margin: 0 0 var(--wa-space-s);
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
        text-align: center;
    }

    .intro {
        margin: 0 0 var(--wa-space-l);
        color: var(--wa-color-neutral-40);
        text-align: center;
    }

    form {
        display: grid;
        gap: var(--wa-space-m);
    }

    wa-callout {
        margin-bottom: var(--wa-space-m);
    }

    wa-button[type="submit"] {
        width: 100%;
    }
`;