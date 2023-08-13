import { css } from "lit";
import { BreakpointMax, mediaQuery } from "./breakpoints";

export const sharedStyles = css`
    :host {
        --title-font: 'Homemade Apple', cursive;
        --subtitle-font: 'Lora', serif;
        --theme-color: #0b0974;
        --highlight-orange: #febf04;
        --highlight-background: linear-gradient(rgb(255, 214, 94) 0%, #febf04 100%);
        --highlight-border-radius: 60px 30px 35px 15px / 25px 38px 66px 53px;
        --highlight-box-shadow: rgb(255 214 94 / 90%) 2px 2px 10px;
    }

    h1, h2, h3, h4 {
        font-weight: normal;
    }

    sl-button[variant="text"]::part(label) {
        font-weight: bold;
        font-family: var(--subtitle-font);
        font-size: 16px;
        color: var(--theme-color);
    }

    a, sl-button[variant="text"] {
        transition: 0.4s linear color;
    }

    a:hover, sl-button[variant="text"]:hover {
        color: brown;
    }

    .highlight {
        display: inline-block;
        font-family: var(--title-font);
        color: var(--theme-color);
        border-radius: var(--highlight-border-radius);
        background: var(--highlight-background);
        box-shadow: var(--highlight-box-shadow);
        transform: rotateZ(-1deg);
    }

    input::placeholder,
    textarea::placeholder {
        color: rgba(33, 37, 41, 0.4) !important;
    }

    ${mediaQuery(BreakpointMax.xs)} {
        .highlight {
            display: block;
            text-align: center;
        }
    }
`;