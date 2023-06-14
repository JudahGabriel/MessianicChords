import { css } from "lit";
import { BreakpointMax, mediaQuery } from "../common/breakpoints";

export const headerStyles = css`
      header {
        padding: 20px;
      }

      ${mediaQuery(BreakpointMax.xs)} {
        header {
          padding-bottom: 0;
        }
      }

      img {
        margin: 5px 40px 5px 40px;
        box-shadow: 0 0 10px var(--theme-color);
        border-radius: 2px;
        width: 100px;
        height: 100px;
        transform: rotateZ(-2deg);
        transition: 0.2s linear transform;
      }

      img:hover {
        transform: rotateZ(4deg);
      }

      ${mediaQuery(BreakpointMax.xs)} {
        img {
          margin: 5px 10px 0 0;
          width: 50px;
          height: 50px;
        }
      }

      h1 {
        font-family: var(--title-font);
        font-size: 2.5em;
        display: block;
        margin-top: 7px;
        margin-bottom: 0;
        line-height: 65px;
        text-shadow: 1px 1px 7px silver;
      }

      ${mediaQuery(BreakpointMax.xs)} {
        h1 {
          margin-top: 0;
          margin-left: 20px;
          font-size: 1.5em;
        }
      }

      h1 a {
        text-decoration: none;
        color: var(--theme-color);
      }

      h2 {
        font-family: var(--subtitle-font);
        color: var(--theme-color);
        margin-top: -5px;
        font-size: 1em;
        background: var(--highlight-background);
        border-radius: var(--highlight-border-radius);
        box-shadow: var(--highlight-box-shadow);
        display: inline-block;
        padding: 8px;
        transform: rotateZ(-1deg);
      }

      h2 span {
        display: inline-block;
        transform: rotateZ(1deg);
      }

      ${mediaQuery(BreakpointMax.xs)} {
        h2 {
          margin-top: 7px;
          font-size: 0.9em;
        }
      }

      .alert {
        font-family: var(--subtitle-font);
      }
    `;