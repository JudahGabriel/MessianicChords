import { css } from "lit";

export const footerStyles = css`
    :host {
        display: block;
        font-family: var(--subtitle-font);
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--wa-color-neutral-100, #f8f9fa);
        width: 100%;
        max-width: 100vw;
        box-sizing: border-box;
        z-index: 1000;
    }

    a {
        color: var(--theme-color);
        text-decoration: none;
    }

    a:hover,
    a:focus-visible {
        color: var(--highlight-orange);
    }

    footer {
        width: 100%;
        max-width: 100vw;
        box-sizing: border-box;
        background-color: inherit;
        gap: 3rem;
        justify-content: center;
        flex-wrap: wrap;
        padding: 0.5em;
        font-size: 0.8em;
        box-shadow: 0 -2px 15px var(--wa-color-neutral-200, #e9ecef);

        @media (max-width: 575px) {
            gap: 1em;
            padding: 1em;
        }
    }
`;
