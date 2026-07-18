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
        margin-top: var(--wa-space-l);
        margin-bottom: var(--wa-space-l);
    }

    /* On phones and tablets, make the search container margin cancel out the parent's padding */
    @media (max-width: ${SizeMax.Sm}px) {
        .search-container {
            margin-left: 0;
            margin-right: 0;
        }

        #search-box {
            width: 95%;
            max-width: 95vw;
        }
    }

    #search-box {
        width: 500px;
    }

    #search-box::part(base) {
        width: 100%;
    }

    #search-box::part(input) {
        width: 100%;
        flex: 1 1 auto;
        min-width: 0;
        color: #0b0974;
        text-align: center;
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
        align-items: stretch;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    ${phonesOnly()} {
        .new-chords {
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
        }
    }

    .new-chords-placeholder-container {
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 0.75rem;
        flex-wrap: wrap;
        width: 100%;
    }

    .new-chord-skeleton {
        width: 18.5em;
        aspect-ratio: 4 / 5;
        --border-radius: 0;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .new-chord-skeleton wa-skeleton {
        width: 100%;
        height: 100%;
    }

    ${phonesOnly()} {
        .new-chords-placeholder-container {
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
        }

        .new-chord-skeleton {
            margin: 10px 20px;
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

    .browse-by-container wa-divider {
        height: 1em;
        --spacing: 0;
    }

    home-jumbotron {
        display: block;

        ${tabletsAndSmaller()} {
            padding-bottom: 16px;
        }
    }
`;