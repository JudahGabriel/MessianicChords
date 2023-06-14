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

  #search-box::placeholder {
      color: rgb(192, 192, 192) !important;
      font-style: italic;
      font-family: serif;
      font-size: 24px !important;
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

  .new-chords-placeholder-container {
    width: 400px;
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
  }
`;