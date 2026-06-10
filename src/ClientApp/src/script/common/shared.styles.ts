import { css } from "lit";
import { BreakpointMax, mediaQuery, phonesOnly } from "./breakpoints";

export const sharedStyles = css`
    :host {
        --title-font: 'Homemade Apple', cursive;
        --subtitle-font: 'Lora', serif;
        --theme-color: #0b0974;
        --highlight-orange: #febf04;
        --highlight-background: linear-gradient(rgb(255, 214, 94) 0%, #febf04 100%);
        --highlight-border-radius: 60px 30px 35px 15px / 25px 38px 66px 53px;
        --highlight-box-shadow: rgb(255 214 94 / 90%) 2px 2px 10px;
        --wa-color-primary-50: rgb(249 249 252);
        --wa-color-primary-100: rgb(236 235 244);
        --wa-color-primary-200: rgb(221 221 236);
        --wa-color-primary-300: rgb(205 205 227);
        --wa-color-primary-400: rgb(184 183 214);
        --wa-color-primary-500: rgb(157 156 199);
        --wa-color-primary-600: rgb(128 127 182);
        --wa-color-primary-700: rgb(102 101 168);
        --wa-color-primary-800: rgb(82 80 156);
        --wa-color-primary-900: rgb(53 51 140);
        --wa-color-primary-950: rgb(21 19 121);

        /* Compatibility aliases for pre-WebAwesome token names used in app styles. */
        --wa-spacing-3x-small: var(--wa-space-3xs);
        --wa-spacing-2x-small: var(--wa-space-2xs);
        --wa-spacing-x-small: var(--wa-space-xs);
        --wa-spacing-small: var(--wa-space-s);
        --wa-spacing-medium: var(--wa-space-m);
        --wa-spacing-large: var(--wa-space-l);
        --wa-spacing-x-large: var(--wa-space-xl);
        --wa-spacing-2x-large: var(--wa-space-2xl);
        --wa-spacing-3x-large: var(--wa-space-3xl);
        --wa-border-radius-medium: var(--wa-border-radius-m);
        --wa-border-radius-large: var(--wa-border-radius-l);
        --wa-shadow-medium: var(--wa-shadow-m);
        --wa-font-size-small: var(--wa-font-size-smaller);
    }

    .container {
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;

        @media (max-width: 575px) {
            padding: 0;
        }
    }

    h1, h2, h3, h4 {
        font-weight: normal;
    }

    wa-button[appearance="plain"]::part(label) {
        font-weight: bold;
        font-family: var(--subtitle-font);
        font-size: 16px;
        color: var(--theme-color);
    }

    a, wa-button[appearance="plain"] {
        transition: 0.4s linear color;
    }

    a:hover, wa-button[appearance="plain"]:hover {
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

    h2.highlight {
        ${phonesOnly()} {
            margin-left: 8px;
            padding: 0 8px;
        }
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

    .text-center {
        text-align: center !important;
    }

    .d-flex {
        display: flex !important;
    }

    .flex-column {
        flex-direction: column !important;
    }

    .flex-wrap {
        flex-wrap: wrap !important;
    }

    .gap-0 {
        gap: 0 !important;
    }

    .gap-1 {
        gap: 0.25rem !important;
    }

    .gap-2 {
        gap: 0.5rem !important;
    }

    .gap-3 {
        gap: 1rem !important;
    }

    .gap-4 {
        gap: 1.5rem !important;
    }

    .gap-5 {
        gap: 3rem !important;
    }

    .mt-0 {
        margin-top: 0 !important;
    }

    .mt-1 {
        margin-top: 0.25rem !important;
    }

    .mt-2 {
        margin-top: 0.5rem !important;
    }

    .mt-3 {
        margin-top: 1rem !important;
    }

    .justify-content-start {
        justify-content: flex-start !important;
    }

    .justify-content-end {
        justify-content: flex-end !important;
    }

    .justify-content-center {
        justify-content: center !important;
    }

    .justify-content-between {
        justify-content: space-between !important;
    }

    .justify-content-around {
        justify-content: space-around !important;
    }

    .justify-content-evenly {
        justify-content: space-evenly !important;
    }

    .align-items-start {
        align-items: flex-start !important;
    }

    .align-items-end {
        align-items: flex-end !important;
    }

    .align-items-center {
        align-items: center !important;
    }

    .align-items-baseline {
        align-items: baseline !important;
    }

    .align-items-stretch {
        align-items: stretch !important;
    }

    .align-content-start {
        align-content: flex-start !important;
    }

    .align-content-end {
        align-content: flex-end !important;
    }

    .align-content-center {
        align-content: center !important;
    }

    .align-content-between {
        align-content: space-between !important;
    }

    .align-content-around {
        align-content: space-around !important;
    }

    .align-content-stretch {
        align-content: stretch !important;
    }

    .fw-lighter {
        font-weight: lighter !important;
    }

    .fw-light {
        font-weight: 300 !important;
    }

    .fw-normal {
        font-weight: 400 !important;
    }

    .fw-medium {
        font-weight: 500 !important;
    }

    .fw-semibold {
        font-weight: 600 !important;
    }

    .fw-bold {
        font-weight: 700 !important;
    }

    .fw-bolder {
        font-weight: bolder !important;
    }

    .w-100 {
        width: 100% !important;
    }
`;

