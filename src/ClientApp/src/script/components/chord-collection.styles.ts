import { css } from "lit";

export const chordCollectionStyles = css`
    :host {
        display: block;
    }

    .chords-container {
        gap: 2.5em;
    }

    .loading-card {
        width: 288px;
        height: 283px;
    }

    sl-skeleton.title {
        width: 93%;
        height: 56px;
    }

    sl-skeleton.artist {
        width: 80%;
        height: 20px;
    }

    sl-skeleton.key {
        width: 20%;
        height: 20px;
    }
`;