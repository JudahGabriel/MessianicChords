import { css } from "lit";
import { phonesOnly } from "../common/breakpoints";

export const browseArtistsStyles = css`
	.artist-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.artist-jump-select {
		min-width: 220px;
		max-width: 320px;

        ${phonesOnly()} {
            margin-left: 8px;
        }
	}
`;