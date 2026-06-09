import { css } from "lit";

export const browseOfflineStyles = css`
    .page {
        padding: 1rem 0 2rem;
    }

    .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 1rem;
    }

    .toolbar sl-input {
        flex: 1;
        min-width: 220px;
    }

    .status {
        margin-bottom: 0.75rem;
        color: #6c757d;
        font-size: 0.95rem;
    }

    sl-progress-bar {
        margin-bottom: 1rem;
    }

    .empty-state {
        color: #6c757d;
    }

    .error {
        color: #b42318;
    }
`;
