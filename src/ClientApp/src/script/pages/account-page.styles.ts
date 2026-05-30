import { css } from "lit";

export const accountPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .account-page {
        max-width: 520px;
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

    sl-tab-panel {
        padding: var(--sl-spacing-small);
    }

    form {
        display: grid;
        gap: var(--sl-spacing-medium);
        margin-top: var(--sl-spacing-large);
    }

    sl-alert {
        margin-top: var(--sl-spacing-medium);
    }

    sl-button[type="submit"] {
        width: 100%;
    }

    .toggle-copy {
        margin: var(--sl-spacing-medium) 0 0;
        color: var(--sl-color-neutral-600);
        text-align: center;
    }

    .link-button {
        background: none;
        border: 0;
        color: var(--sl-color-primary-600);
        cursor: pointer;
        font: inherit;
        padding: 0;
        text-decoration: underline;
    }

    .signed-in {
        display: grid;
        gap: var(--sl-spacing-medium);
        text-align: center;
    }
`;
