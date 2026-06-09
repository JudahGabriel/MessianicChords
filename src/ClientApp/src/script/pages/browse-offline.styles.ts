import { css } from "lit";

export const browseOfflineStyles = css`
    .page {
        padding: 1rem 0 2rem;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .status {
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

    chord-collection {
        display: block;
        margin-top: 2rem;
    }

    .media-prefetch-host {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }

    @media (max-width: 640px) {
        .header-row {
            flex-wrap: wrap;
            align-items: flex-start;
        }

        .actions {
            width: 100%;
        }

        .actions sl-button {
            flex: 1 0 100%;
            width: 100%;
            margin-left: auto;
        }
    }
`;
