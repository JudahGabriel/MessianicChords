import { css } from "lit";

export const chordCollectionStyles = css`
    :host {
        display: block;
    }

    .chords-container {
        gap: 2.5em;
    }

    .loading-card {
        width: 18.5em;
    }

    .loading-card::part(base) {
        border: 1px solid #d6d6d6;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        padding: 0;
    }

    .loading-media {
        position: relative;
        aspect-ratio: 4 / 5;
        overflow: hidden;
        background: linear-gradient(160deg, #eceff3 0%, #dfe4ec 100%);
    }

    .loading-overlay {
        position: absolute;
        left: 0;
        right: 0;
        z-index: 1;
        padding: 0.75rem 0.9rem;
    }

    .loading-overlay-top {
        top: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 100%);
    }

    .loading-overlay-bottom {
        bottom: 0;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(255, 0, 0, 0) 100%);
    }

    wa-skeleton.title {
        width: 75%;
        height: 2.2rem;
        border-radius: 6px;
    }

    wa-skeleton.artist {
        width: 62%;
        height: 1.05rem;
        border-radius: 4px;
    }

    wa-skeleton.key {
        width: 23%;
        height: 0.9rem;
        margin-top: 0.4rem;
        border-radius: 4px;
    }
`;