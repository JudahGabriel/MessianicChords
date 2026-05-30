import { css } from "lit";
import { SizeMax } from "../common/constants";

export const browseArtistsStyles = css`
    .jump-to-artist {
        transform: translateY(32px);
        margin-top: -32px;
    }

    /* On small phones, don't shift it into the artist heading */
    @media (max-width: ${SizeMax.Xs}px) {
        .jump-to-artist {
            transform: none;
            margin-top: initial;
        }
    }
`;