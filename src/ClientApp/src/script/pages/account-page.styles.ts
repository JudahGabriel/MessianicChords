import { css } from "lit";

export const accountPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .account-page {
        max-width: 520px;
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

    wa-tab-panel {
        padding: var(--wa-spacing-small);
    }

    form {
        display: grid;
        gap: var(--wa-spacing-medium);
        margin-top: var(--wa-spacing-large);
    }

    wa-alert {
        margin-top: var(--wa-spacing-medium);
    }

    wa-button[type="submit"] {
        width: 100%;
    }

    .toggle-copy {
        margin: var(--wa-spacing-medium) 0 0;
        color: var(--wa-color-neutral-600);
        text-align: center;
    }

    .link-button {
        background: none;
        border: 0;
        color: var(--wa-color-primary-600);
        cursor: pointer;
        font: inherit;
        padding: 0;
        text-decoration: underline;
    }

    .signed-in {
        display: grid;
        gap: var(--wa-spacing-medium);
        text-align: center;
    }
`;
