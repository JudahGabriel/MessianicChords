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
        align-items: self-end;
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

    .account-menu-trigger {
        width: 2.25rem;
        height: 2.25rem;
        --sl-input-border-color: rgba(255, 255, 255, 0.35);
        --sl-input-border-color-hover: white;
        --sl-input-border-color-focus: white;
        --sl-focus-ring-color: rgba(255, 255, 255, 0.45);
        --sl-color-neutral-300: black;
        --sl-input-background-color: rgba(255, 255, 255, 0.12);
        --sl-color-neutral-700: white;
    }

    .account-menu-trigger-signed-out {
        --sl-input-border-color: rgba(255, 255, 255, 0.35);
        --sl-input-border-color-hover: white;
        --sl-input-border-color-focus: white;
        --sl-focus-ring-color: rgba(255, 255, 255, 0.45);
        --sl-color-neutral-700: white;
        --sl-input-background-color: rgba(255, 255, 255, 0.12);
        --sl-color-primary-600: white;
    }

    .account-menu-trigger::part(base) {
        padding: 0;
        border-radius: 999px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .account-menu-trigger-signed-out::part(base) {
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .account-menu-trigger {
        &::part(label) {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
        }

        sl-icon {
            color: white;
            font-size: 1.5em;
            margin-top: 5px;
        }
    }

    .account-menu-trigger-signed-out {
        display: flex;
        align-items: center;
        justify-content: center;

        sl-icon {
            color: white;
            font-size: 1.5em;
            margin-top: 10px;
        }
    }

    .avatar-initial {
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1;
        color: var(--theme-color);
    }

    .avatar-image {
        width: 100%;
        height: 100%;
        border-radius: 999px;
        object-fit: cover;
        display: block;
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