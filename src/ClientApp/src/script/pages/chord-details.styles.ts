import { css } from "lit";
import { SizeMax } from "../common/constants";

export const chordDetailStyles = css`
    :host {
        --iframe-width: 876px;
        --iframe-page-height: 1100px;
        --soft-gray: rgb(248, 248, 248);
    }

    .song-name {
        font-family: var(--title-font);
        font-size: 1.8em;
        margin-bottom: -15px;
    }

    @media (max-width: ${SizeMax.Md}px) {
        .song-name {
            font-size: 1.3em;
            margin-bottom: -5px;
        }
    }

    .song-name,
    .hebrew-song-name {
        font-weight: bold;
        color: var(--theme-color);
    }

    .hebrew-song-name {
        font-family: "David", var(--title-font);
        font-size: 2.5em;
        direction: rtl;
    }

    @media (max-width: ${SizeMax.Md}px) {
        .hebrew-song-name {
            font-size: 1.5em;
        }
    }

    .artist-author-name {
        justify-self: end;
        transform: rotateZ(-1deg);
        line-height: 45px;
    }

    .artist-author-name a,
    span.artist-author-name {
        font-family: var(--title-font);
        text-decoration: none;
        color: var(--theme-color);
        border-radius: var(--highlight-border-radius);
        background: var(--highlight-background);
        box-shadow: var(--highlight-box-shadow);
        padding: 3px 10px;
        font-size: 0.9em;
    }

    @media (max-width: ${SizeMax.Md}px) {
        .artist-author-name a,
        .artist-author-name span {
            padding: 2px 6px;
            font-size: 0.8em;
        }
    }

    .artist-author-name a:hover {
        color: brown;
    }

    .btn-toolbar {
        margin-bottom: -40px;
        transform: translateX(0) translateY(13px);
        justify-content: end;
    }

    @media (max-width: ${SizeMax.Md}px) {
        .btn-toolbar {
            margin-bottom: 13px;
            margin-left: -2px;
            justify-content: start;
        }
    }

    .btn-toolbar img {
        width: 22px;
        height: 22px;
    }

    .btn-toolbar .transpose-btn {
        position: relative;
    }

    .btn-toolbar .transpose-btn span {
        position: absolute;
        top: 0;
        right: 0;
    }

    iframe {
        width: 100%;
    }

    @media (max-width: ${SizeMax.Md}px) {
        /* On phones and tablets, we show the iframe in full width but scaled down. User can scale in as necessary */
        iframe {
            width: var(--iframe-width);
            transform: scale(0.8); /* on tablets, scale 0.8 */
            transform-origin: 0 0;
            box-shadow: -5px 0 2px var(--soft-gray), 5px 0 2px var(--soft-gray);
        }
    }

    @media (max-width: ${SizeMax.Sm}px) {
        iframe {
            transform: scale(0.6); /* on small tablets or phones in landscape orientation, scall a bit smaller */
        }
    }

    @media (max-width: ${SizeMax.Xs}px) {
        iframe {
            transform: scale(0.34); /** on phones, scale smaller still */
        }
    }

    @media print {
        iframe {
            /* transform: scale(1.4) translateX(-110px) translateY(-50px);
            transform-origin: 0 0; */
            box-shadow: none;
            border: none;
            width: var(--iframe-width);
        }
    }

    .site-text {
        font-size: 0.4em;
        font-family: var(--subtitle-font);
    }

    iframe.one-page {
        height: var(--iframe-page-height);
    }

    iframe.two-page {
        height: calc(2 * var(--iframe-page-height));
    }

    iframe.three-page {
        height: calc(3 * var(--iframe-page-height));
    }

    .loading-name-artist {
        margin-bottom: 20px;
    }

    .placeholder {
        height: 30px;
    }

    .iframe-loading-placeholder {
        background-color: var(--soft-gray);
        height: calc(var(--iframe-page-height) / 2);
        width: var(--iframe-width);
    }

    @media(max-width: ${SizeMax.Xs}px) {
        .iframe-loading-placeholder {
            width: 100%;
        }
    }

    /* Google Docs published to the web have no document border. We'll add one, otherwise it's kinda weird looking. */
    .web-published-doc,
    .img-preview,
    .plain-text-preview
    {
        box-shadow: 0 0 3px 0px silver;
        margin-top: 13px;
    }

    .plain-text-preview {
        white-space: pre;
        text-align: left;
        padding: 0.5in;
        min-height: 9in;
        font-size: 16px;
        font-family: monospace;
        overflow: auto;
        background-color: white;
    }

    .plain-text-preview .chord {
        background-color: #e9ecef;
        font-weight: bold;
        box-shadow: #e9ecef 0px 0px 15px 2px;
    }

    @media print {
        .web-published-doc,
        .img-preview,
        .plain-text-preview {
            box-shadow: none;
            width: var(--iframe-width);
        }

        .img-preview {
            min-height: 11in; // Standard page size for PDF and Word docs
        }

        .plain-text-preview .chord {
            background-color: transparent;
            box-shadow: none;
        }
    }

    /* We don't display printable screenshots. They're just used for printing. */
    .printable-screenshots {
        display: none;
    }

    @media print {
        .printable-screenshots {
            display: block;
        }
    }
`;