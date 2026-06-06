import { css } from "lit";

export const browseRandomStyles = css`
    .random-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
        margin-bottom: 1rem;
    }

    .random-header .highlight {
        margin-bottom: 0;
    }

    .dice-block-1 {
        transform: rotateZ(-20deg);
        transition: .2s ease-in-out transform;
    }

    .dice-block-2 {
        transform: rotateZ(28deg);
        transition: .2s ease-in-out transform;
    }
`;