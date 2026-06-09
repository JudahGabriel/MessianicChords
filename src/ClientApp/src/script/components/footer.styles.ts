import { css } from "lit";

export const footerStyles = css`
    :host {
        font-family: var(--subtitle-font);
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--sl-color-neutral-100);
        width: 100%;
        max-width: 100vw;
        box-sizing: border-box;
    }

    a {
        color: var(--theme-color);
        text-decoration: none;
    }

    footer {
        width: 100%;
        max-width: 100vw;
        box-sizing: border-box;
        gap: 3rem;
        justify-content: center;
        flex-wrap: wrap;
        padding: 0.5em;
        font-size: 0.8em;
        box-shadow: 0 -2px 15px var(--sl-color-neutral-100);

        @media (max-width: 575px) {
            gap: 1em;
            padding: 1em 0;
        }
    }
`;