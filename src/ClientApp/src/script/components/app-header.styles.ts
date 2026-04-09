import { css } from "lit";
import { mediaQuery, BreakpointMax } from "../common/breakpoints";

export const appHeaderStyles = css`
    header {
        background: var(--theme-color, #0b0974);
        padding: 0 var(--sl-spacing-medium);
        font-family: var(--subtitle-font);
    }

    nav {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
        max-width: 1200px;
        margin: 0 auto;
        height: 56px;
    }

    /* Logo area */
    .nav-left {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        flex-shrink: 0;
    }

    .logo-link {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        text-decoration: none;
        color: white;
    }

    .logo-link:hover {
        color: var(--highlight-orange);
    }

    .logo-link img {
        border-radius: 6px;
    }

    .app-name {
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 1.1rem;
        white-space: nowrap;
    }

    /* Nav links */
    .nav-links {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
    }

    .nav-links a {
        color: rgba(255, 255, 255, 0.85);
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 600;
        padding: var(--sl-spacing-x-small) 0;
        transition: color 0.2s;
    }

    .nav-links a:hover {
        color: var(--highlight-orange);
    }

    /* Search */
    .nav-search {
        flex: 1;
        display: flex;
        justify-content: center;
        max-width: 320px;
    }

    .nav-search sl-input {
        width: 100%;
    }

    /* Right side */
    .nav-right {
        display: flex;
        align-items: center;
        margin-left: auto;
        flex-shrink: 0;
    }

    /* Hamburger toggle - hidden on desktop */
    .menu-toggle {
        display: none;
        color: white;
        font-size: 1.4rem;
        margin-left: auto;
    }

    /* Mobile layout */
    ${mediaQuery(BreakpointMax.md)} {
        nav {
            flex-wrap: wrap;
            height: auto;
            padding: var(--sl-spacing-small) 0;
        }

        .nav-left {
            width: 100%;
            justify-content: space-between;
        }

        .menu-toggle {
            display: inline-flex;
        }

        .nav-links,
        .nav-search,
        .nav-right {
            display: none;
            width: 100%;
        }

        .nav-links.open,
        .nav-search.open,
        .nav-right.open {
            display: flex;
        }

        .nav-links.open {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--sl-spacing-x-small);
            padding: var(--sl-spacing-small) 0;
        }

        .nav-search.open {
            max-width: 100%;
            padding-bottom: var(--sl-spacing-small);
        }

        .nav-right.open {
            padding-bottom: var(--sl-spacing-small);
        }
    }
`;