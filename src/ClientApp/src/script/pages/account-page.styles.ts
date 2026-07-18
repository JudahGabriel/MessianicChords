import { css } from "lit";

export const accountPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .account-page {
        max-width: 520px;
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

    wa-tab-panel {
        padding: var(--wa-space-s);
    }

    form {
        display: grid;
        gap: var(--wa-space-m);
        margin-top: var(--wa-space-l);
    }

    wa-callout {
        margin-top: var(--wa-space-m);
    }

    wa-button[type="submit"] {
        width: 100%;
    }

    .toggle-copy {
        margin: var(--wa-space-m) 0 0;
        color: var(--wa-color-neutral-40);
        text-align: center;
    }

    .link-button {
        background: none;
        border: 0;
        color: var(--wa-color-brand-40);
        cursor: pointer;
        font: inherit;
        padding: 0;
        text-decoration: underline;
    }

    .signed-in {
        display: grid;
        gap: var(--wa-space-m);
        text-align: center;
    }
`;
