import { css } from "lit";
import { phonesOnly } from "../common/breakpoints";

export const chordCardStyles = css`
    .chord-card {
        text-align: left;
        float: left;
        width: 18em;
        cursor: pointer;
        transition: all linear 0.2s;
    }

    ${phonesOnly()} {
        .chord-card {
            margin: 10px 20px;
        }
    }

    .chord-card:hover {
        background-color: rgba(0, 0, 0, .03);
        box-shadow: 0 0 10px 0 silver;
    }

    .artist {
        font-size: 16px;
        color: #0B0974;
        text-decoration: none;
    }

    .song-name,
    .hebrew-song-name {
        font-size: 26px;
        color: Brown;
        text-decoration: none;
        text-shadow: 1px 1px 1px silver;
        font-family: var(--title-font);
    }

    .hebrew-song-name {
        direction: rtl;
        text-align: right;
        padding-left: 10px;
    }

    label {
        color: black;
    }
`;