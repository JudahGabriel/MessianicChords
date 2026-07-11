import { css } from "lit";
import { phonesOnly } from "../common/breakpoints";

export const chordCardStyles = css`
    .chord-card {
        float: left;
        width: 18.5em;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .chord-card::part(base) {
        border: 1px solid #d6d6d6;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .card-link {
        display: block;
        text-decoration: none;
        color: inherit;
    }

    .card-media-link {
        cursor: pointer;
    }

    .card-media {
        position: relative;
        aspect-ratio: 4 / 5;
        background: #f3f4f7;
        overflow: hidden;
    }

    .album-art {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .fallback-art {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(160deg, #eceff3 0%, #dfe4ec 100%);
        color: #6b7280;
    }

    .fallback-art sl-icon {
        font-size: 4.25rem;
    }

    ${phonesOnly()} {
        .chord-card {
            width: 16.5em;
            margin: 8px 12px;
        }
    }

    .chord-card:hover {
        transform: translateY(-2px);
    }

    .chord-card:hover::part(base) {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.16);
    }

    .overlay {
        position: absolute;
        left: 0;
        right: 0;
        z-index: 1;
        padding: 0.75rem 0.9rem;
    }

    .overlay-top {
        top: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.0) 100%);
    }

    .overlay-bottom {
        bottom: 0;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.72) 0%, rgba(255, 0, 0, 0.0) 100%);
    }

    .song-name {
        font-size: 1.7rem;
        line-height: 1.15;
        color: #ffffff;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
        font-family: var(--title-font);
    }

    .artist {
        display: inline-block;
        font-size: 1.05rem;
        color: #f4f7ff;
        font-weight: 600;
        text-decoration: none;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    .artist-link {
        position: relative;
        z-index: 2;
        cursor: pointer;
    }

    .artist-link:hover,
    .artist-link:focus-visible {
        color: #f4f7ff;
    }

    .artist:hover {
        text-decoration: underline;
    }

    .key {
        margin-top: 0.25rem;
        font-size: 0.92rem;
        color: #e8ecff;
        font-weight: 500;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    .key span {
        opacity: 0.9;
        margin-right: 0.25rem;
    }
`;