import { css } from "lit";

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
		padding: 8px;
	}

	.artist-details {
		border-radius: 4px;
		padding: 8px;
	}

	.artist-details::part(summary) {
		padding: 8px;
		cursor: pointer;
	}

	.artist-details::part(base) {
		border-radius: 4px;
	}

	.artist-summary-text {
		font-family: var(--subtitle-font);
		font-weight: 600;
		color: var(--theme-color);
		background: transparent;
		line-height: 1.3;
	}

	.artist-content {
		padding: 16px 8px;
	}

	@media (max-width: 768px) {
		.artist-header-row > h2.highlight {
			width: 100%;
		}

		.artist-jump-select {
			width: 100%;
			min-width: 0;
			max-width: none;
		}
	}
`;