import { css } from "lit";

export const footerStyles = css`
    :host {
        font-family: var(--subtitle-font);
        position: fixed;
        left: 0;
        bottom: 0;
        background-color: var(--sl-color-neutral-100);
        width: 100%;
    }

    a {
        color: var(--theme-color);
        text-decoration: none;
    }
`;