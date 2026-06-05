import { css } from "lit";

export const browseTagsStyles = css`
    .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

    .tag-jump-select {
        min-width: 220px;
        max-width: 320px;
        padding: 8px;
    }

    .tag-details {
        border-radius: 4px;
        padding: 8px;
    }

    .tag-details::part(summary) {
        padding: 8px;
        cursor: pointer;
    }

    .tag-details::part(base) {
        border-radius: 4px;
    }

    .tag-summary-text {
        font-family: var(--subtitle-font);
        font-weight: 600;
        color: var(--theme-color);
        background: transparent;
        line-height: 1.3;
    }

    .tag-content {
        padding: 16px 8px;
    }
`;