import { css } from "lit";

export const browseSongsStyles = css`
    .songs-page {
        padding-top: 1rem;
    }

    .songs-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
    }

    .songs-heading {
        margin: 0;
    }

    .songs-group-details {
        border-radius: 4px;
        padding: 8px;
    }

    .songs-group-details::part(summary) {
        padding: 8px;
        cursor: pointer;
    }

    .songs-group-details::part(base) {
        border-radius: 4px;
    }

    .songs-group-summary {
        font-family: var(--subtitle-font);
        font-weight: 600;
        color: var(--theme-color);
        background: transparent;
        line-height: 1.3;
    }

    .songs-group-content {
        padding: 16px 8px;
    }

    @media (max-width: 768px) {
        .songs-header-row > h2.highlight {
            width: 100%;
        }
    }
`;