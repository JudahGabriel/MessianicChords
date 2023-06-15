import { css } from "lit";
import { SizeMax } from "../common/constants";
import { mediaQueryMobile } from "../common/breakpoints";
export const appHomeStyles = css`
:host {
    font-family: var(--subtitle-font);
  }

  @media (max-width: ${SizeMax.Md}px) {
    .home-page {
      margin-top: -30px;
    }
  }

  .search-container {
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: var(--subtitle-font);
    margin-top: var(--sl-spacing-large);
    margin-bottom: var(--sl-spacing-large);
  }

  /* On phones and tablets, make the search container margin cancel out the parent's padding */
  @media (max-width: ${SizeMax.Sm}px) {
      .search-container {
          margin-left: -20px;
          margin-right: -20px;
      }
  }

  #search-box::part(input) {
      width: 500px;
      color: #0b0974;
  }

  @media (max-width: ${SizeMax.Xs}px) {
      #search-box {
          width: 90%;
      }
  }

  nav a {
    color: var(--theme-color);
    text-decoration: none;
  }

  nav span {
    font-family: var(--subtitle-font);
  }

  .new-chords {
    justify-content: center;
    flex-direction: row;
    align-items: center;
  }

  .new-chords sl-divider {
    height: 1em;
  }

  .new-chords-placeholder-container {
    width: 80%;
  }

  @media (max-width: ${SizeMax.Xs}px) {
    .new-chords-placeholder-container {
      width: 100%;
    }
  }

  @media (max-width: ${SizeMax.Xs}px) {
      .new-chords {
          flex-direction: column;
          align-items: center;
          margin-bottom: 10px;
      }
  }

  .new-chords a {
      padding-left: 5px;
      padding-right: 5px;
  }

  ${mediaQueryMobile()} {
      .new-chords a {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          display: inline-block;
          max-width: 300px;
          padding: 4px;
      }
  }

  .loading-block {
    text-align: center;
    margin: 50px;
  }

  .search-results-container {
    margin-top: 50px;
  }

  ${mediaQueryMobile()} {
    margin-top: 20px;
  }

  .new-chord-link::part(label) {
    max-width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding-left: var(--sl-spacing-x-small);
    padding-right: var(--sl-spacing-x-small);
  }

  .browse-by-container sl-divider {
    height: 1em;

  }
`;