import { css } from "lit";

export const myStarredPageStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
    }

    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--sl-spacing-large) var(--sl-spacing-medium);
    }

    h1 {
        margin: 0 0 var(--sl-spacing-medium);
        color: var(--theme-color);
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 2rem;
    }

    .cards {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sl-spacing-medium);
    }

    .empty {
        color: var(--sl-color-neutral-600);
    }
`;
