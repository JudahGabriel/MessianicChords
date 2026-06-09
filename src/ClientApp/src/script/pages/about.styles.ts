import { css } from "lit";

export const aboutStyles = css`
    :host {
        font-family: var(--subtitle-font);
    }

    .about-page {
        padding: 1.25rem 1rem 2rem;
    }

    .about-card {
        max-width: 900px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #e6e6ef;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 6px 20px rgba(11, 9, 116, 0.08);
    }

    .about-title {
        margin: 0 0 1rem;
    }

    .about-copy {
        color: #25253a;
        line-height: 1.55;
        font-size: 1.15rem;
    }

    .about-copy::after {
        content: "";
        display: block;
        clear: both;
    }

    .author-photo {
        float: left;
        width: min(260px, 35vw);
        max-width: 100%;
        margin: 0.25rem 1.25rem 0.75rem 0;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    }

    p {
        margin: 0 0 0.95rem;
    }

    @media (max-width: 768px) {
        .about-page {
            padding: 0.75rem 0.75rem 1.5rem;
        }

        .about-card {
            padding: 1rem;
            border-radius: 10px;
        }

        .author-photo {
            float: none;
            display: block;
            width: min(220px, 70vw);
            margin: 0 auto 1rem;
        }
    }
`;
