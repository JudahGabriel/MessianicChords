import { css } from "lit";
import { SizeMax } from "../common/constants";
import { tabletsAndSmaller, phonesOnly } from "../common/breakpoints";

export const appHomeStyles = css`
    :host {
        font-family: var(--subtitle-font);
    }

    ${tabletsAndSmaller()} {
        .home-page {
            margin-top: -30px;
        }
    }

    .search-container {
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: var(--subtitle-font);
        margin-top: var(--sl-spacing-large);
        margin-bottom: var(--sl-spacing-large);
    }

    /* On phones and tablets, make the search container margin cancel out the parent's padding */
    @media (max-width: ${SizeMax.Sm}px) {
        .search-container {
            margin-left: -20px;
            margin-right: -20px;
        }
    }

    #search-box::part(input) {
        width: 500px;
        color: #0b0974;
        text-align: center;
    }

    @media (max-width: ${SizeMax.Xs}px) {
        #search-box {
            width: 90%;
        }
    }

    nav a {
        color: var(--theme-color);
        text-decoration: none;
    }

    nav span {
        font-family: var(--subtitle-font);
    }

    .new-chords, .browse-by-container {
        min-height: 32px;
    }

    .new-chords {
        justify-content: center;
        flex-direction: row;
        align-items: center;
        gap: 0.25em;
    }

    .new-chords sl-divider {
        height: 1em; 
        --spacing: 0;
    }

    ${phonesOnly()} {
        .new-chords {
            flex-direction: column;
            gap: 0.5em;
            align-items: center;
        }

        .new-chords sl-divider {
            display: none;
        }
    }

    .new-chords sl-divider:last-of-type {
        display: none;
    }

    .new-chords-placeholder-container {
        width: 80%;
    }

    ${phonesOnly()} {
        .new-chords-placeholder-container {
            width: 100%;
        }
    }

    ${phonesOnly()} {
        .new-chords a {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            width: 100%;
            display: inline-block;
            max-width: 300px;
        }
    }

    .load-more-chords-btn::part(base) {
        height: 20px;
        font-size: 16px;
    }

    .load-more-chords-btn::part(label) {
        padding: 0;
        font-weight: bold;
    }

    .loading-block {
        text-align: center;
        margin: 50px;
    }

    chord-collection {
        margin-top: 50px;
    }

    .browse-by-container sl-divider {
        height: 1em;
        --spacing: 0;
    }
`;