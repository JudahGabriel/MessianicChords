import { css } from "lit";
import { SizeMax } from "../common/constants";
import { phonesOnly, tabletsAndSmaller } from "../common/breakpoints";

export const chordDetailStyles = css`
    :host {
        --iframe-width: 876px;
        --iframe-page-height: 1100px;
        --soft-gray: rgb(248, 248, 248);
        font-family: var(--subtitle-font);
    }

    .col-12 {
        @media (max-width: ${SizeMax.Md}px) {
            padding-right: 0;
        }
    }



    .song-name {
        font-family: var(--title-font);
        font-size: 1.8em;
        margin-bottom: -15px;
        margin-top: 0;

        ${phonesOnly()} {
            text-align: center;
        }

        ${tabletsAndSmaller()} {
            font-size: 1.3em;
            margin-bottom: -5px;
        }
    }

    .chart-and-sidebar-container {
        display: flex;
        flex-direction: row;
        gap: 16px;

        /** On tablets and smaller, stack the chart and sidebar vertically */
        ${tabletsAndSmaller()} {
            flex-direction: column;
        }

        .chord-chart {
            flex: 0 1 66.66666667%;
            width: 66.66666667%;
            min-width: 0;

            /** On tablets and smaller, make the chord chart take up the full width */
            ${tabletsAndSmaller()} {
                width: 100%;
            }
        }
    }

    .song-artist-and-title-container {
        padding: 4px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;

        ${phonesOnly()} {
            flex-direction: column;
            align-items: center;
        }
    }

    .song-name,
    .hebrew-song-name {
        font-weight: bold;
        color: var(--theme-color);
    }

    .hebrew-song-name {
        font-family: "David", var(--title-font);
        font-size: 1.3em;
        direction: rtl;
    }

    @media (max-width: ${SizeMax.Md}px) {
        .hebrew-song-name {
            font-size: 1.5em;
        }
    }

    .artist-author-name {
        justify-self: end;

        font-family: var(--title-font);
        font-size: 1.8em;
        margin-bottom: -15px;
        margin-top: 0;
    }

    .artist-author-name a,
    span.artist-author-name {
        text-decoration: none;
        color: var(--theme-color);
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
        wa-button {
            --wa-form-control-height: 40px;
            --wa-form-control-padding-inline: 16px;
            font-size: 14px;
        }

        wa-button:state(icon-button),
        #chord-star-btn {
            width: 55px;
        }

        wa-icon {
            font-size: 1.5em;
            transform: translateY(4px);

            @media (max-width: ${SizeMax.Xs}px) {
                transform: translateY(2px);
            }
        }

        wa-button-group {
            margin-top: 16px;
        }

        .transpose-value {
            min-width: 50px; /** So that changing the transpose value won't change the width of the button */
        }

        .transpose-value::part(label) {
            padding-left: 4px;
            padding-right: 4px;
        }

        .star-icon {
            transition: color 0.2s;
            
            ${phonesOnly()} {
                transform: translateY(4px);
            }
        }

        .star-icon[name='star-fill'] {
            color: var(--highlight-orange);
        }
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

        /** When printing, make our container take up the full page. */
        .container {
            margin: 0;
            max-width: 100%;
        }

        .song-artist-and-title-container {
            gap: 10px;
            padding-left: 0;            

            .song-name, .artist-author-name {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                font-size: 2.5em;
            }

            .hebrew-song-name {
                font-size: 1.1em;
            }
        }

        .chord-chart {
            width: 100%;

            .plain-text-preview {
                padding-left: 0;
                padding-top: 0;
            }
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

    .img-preview img {
        max-width: 100%;
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

        /** On small screens, reduce padding for better readability in the smaller space */
        @media (max-width: ${SizeMax.Xs}px) {
            padding: 8px 4px;
        }
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
            overflow-x: hidden;
        }

        .plain-text-preview .chord {
            background-color: transparent;
            box-shadow: none;
        }

        .img-preview {
            min-height: 11in; // Standard page size for PDF and Word docs
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

    .sidebar {
        flex: 1 1 33.33333333%;
        min-width: 0;
        margin-top: 13px;
        margin-bottom: 16px;

        .album-art-card {
            --spacing: 0;
            overflow: hidden;
        }

        .album-art-image {
            display: block;
            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: container;
            background: var(--wa-color-neutral-90);
        }

        wa-card {
            --spacing: 10px;
            --wa-panel-border-width: 0;
            font-family: var(--subtitle-font);

            strong {
                text-align: right;
            }

            strong, blockquote {
                font-family: var(--title-font);
            }
        }

        p {
            margin: 0;
            min-height: 35px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }

        .media-links {
            wa-button {
                width: fit-content;
            }
        }

        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-end;
        }

        .tag-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--wa-color-neutral-90);
            padding: 4px 10px 4px 14px;
            font-family: var(--title-font);
            font-size: 0.85em;
            position: relative;
            isolation: isolate;
            clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
            color: inherit;
            text-decoration: none;
        }

        .tag-chip::before {
            content: "";
            position: absolute;
            inset: -1px;
            background: var(--wa-color-neutral-70);
            clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
            z-index: -1;
        }

        .tag-chip::after {
            content: "";
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--wa-color-surface-default);
            border: 1px solid var(--wa-color-neutral-70);
            position: absolute;
            left: 5px;
            top: 50%;
            transform: translateY(-50%);
        }

        .tag-chip wa-icon {
            font-size: 0.95em;
            color: var(--theme-color);
        }

        .tag-chip:hover {
            background: var(--wa-color-neutral-80);
        }

        .tag-chip:focus-visible {
            outline: 2px solid var(--theme-color);
            outline-offset: 2px;
        }

        .comments-section {
            padding: 4px;
            box-sizing: border-box;
        }

        .comments-scroll {
            border: 1px solid var(--wa-color-neutral-80);
            border-radius: 4px;
            padding: 8px;
            background-color: #fff;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
            overflow-y: auto;
            max-height: 300px;
            margin-bottom: 8px;
        }

        .comment-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .comment-item {
            border-bottom: 1px solid var(--wa-color-neutral-90);
            padding-bottom: 8px;
            min-width: 0;
        }

        .comment-item:last-child {
            border-bottom: 0;
            padding-bottom: 0;
        }

        .comment-content {
            white-space: pre-wrap;
            margin: 0 0 6px 0;
            min-height: auto;
            display: block;
            font-family: var(--title-font);
            padding: 4px;
        }

        .comment-attribution {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-left: 12px;
            font-family: var(--subtitle-font);
            font-size: 0.85em;
            color: var(--wa-color-neutral-40);
            min-width: 0;
        }

        .comment-attribution-hyphen {
            flex-shrink: 0;
        }

        .comment-author {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }

        .comment-author-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .comment-avatar {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }

        .comment-avatar-icon {
            font-size: 18px;
            color: var(--wa-color-neutral-50);
            flex-shrink: 0;
        }

        .comment-date {
            color: var(--wa-color-neutral-50);
            white-space: nowrap;
            margin-left: auto;
        }

        .comment-form {
            margin-top: 0;
        }

        .comment-input,
        .comment-edit-box {
            width: 100%;
            min-height: 70px;
            max-width: 100%;
            box-sizing: border-box;
        }

        .comment-input::part(base),
        .comment-edit-box::part(base) {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
        }

        .comment-actions {
            margin-top: 6px;
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .comment-edit-button wa-icon {
            font-size: 1rem;
        }

        .comments-muted,
        .comments-sign-in,
        .comments-error {
            margin: 0;
            min-height: auto;
            display: block;
        }

        .comments-muted {
            color: var(--wa-color-neutral-40);
        }

        .comments-error {
            color: var(--wa-color-danger-40);
        }

        audio {
            width: 100%;
        }

        [slot='header'] {
            background: var(--highlight-background);
            border-radius: var(--highlight-border-radius);
            font-family: var(--subtitle-font);
            color: var(--theme-color);
            padding-left: 10px;
            padding-right: 10px;
            margin-left: -10px; /** Offset the left padding so that the text beneath aligns */
            margin-right: -10px;

            wa-icon {
                color: var(--theme-color);
            }

            .d-flex {
                min-height: 32px;
            }
        }
    }
`;