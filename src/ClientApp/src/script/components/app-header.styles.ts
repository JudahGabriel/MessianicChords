import { css } from "lit";
import { mediaQuery, BreakpointMax, phonesOnly } from "../common/breakpoints";

export const appHeaderStyles = css`
    header {
        background: var(--theme-color, #0b0974);
        padding: 0 var(--wa-space-m);
        font-family: var(--subtitle-font);
        position: relative;
    }

    nav {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--wa-space-m);
        max-width: 1200px;
        margin: 0 auto;
        height: 56px;

        ${phonesOnly()} {
            gap: 0;
        }
    }

    /* Logo area */
    .nav-left {
        display: flex;
        align-items: center;
        gap: var(--wa-space-s);
        flex-shrink: 0;
    }

    .logo-link {
        display: flex;
        align-items: self-end;
        gap: var(--wa-space-s);
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
        display: none;
        font-family: var(--title-font, 'Homemade Apple', cursive);
        font-size: 1.1rem;
        white-space: nowrap;
    }

    /* Nav links */
    .nav-links {
        display: flex;
        align-items: center;
        gap: var(--wa-space-m);
    }

    .nav-center {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--wa-space-m);
        min-width: 0;
    }

    .nav-links a {
        color: rgba(255, 255, 255, 0.85);
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 600;
        padding: var(--wa-space-xs) 0;
        transition: color 0.2s;
    }

    .nav-links a:hover {
        color: var(--highlight-orange);
    }

    .nav-links a.active {
        color: var(--highlight-orange);
    }

    /* Search */
    .nav-search {
        display: flex;
        align-items: center;
    }

    .nav-search-mobile {
        display: none;
    }

    .nav-search-desktop {
        flex: 0 1 auto;
        justify-content: flex-end;
    }

    .nav-search-desktop.open {
        flex: 1;
        max-width: 320px;
    }

    .nav-search-desktop .search-controls {
        display: flex;
        align-items: center;
        gap: var(--wa-space-xs);
        width: 100%;
    }

    .nav-search-desktop .search-input {
        flex: 1 1 auto;
        min-width: 0;
    }

    .search-toggle-button,
    .search-close-button {
        color: white;
    }

    .menu-toggle wa-icon,
    .search-toggle-button wa-icon,
    .search-close-button wa-icon {
        color: white;
    }

    .search-toggle-button::part(base),
    .search-close-button::part(base) {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    /* Right side */
    .nav-right {
        display: flex;
        align-items: center;
        gap: var(--wa-space-xs);
        flex-shrink: 0;
        justify-self: end;
    }

    /* Desktop-only offline indicator; hidden on mobile where .offline-mobile is used instead */
    .offline-desktop {
        display: flex;
        align-items: center;
    }

    /* Groups the offline indicator and hamburger toggle together on the right of nav-left */
    .nav-left-right-group {
        display: none;
        align-items: center;
        gap: 0;
    }

    /* Mobile-only offline indicator; sits next to the hamburger toggle */
    .offline-mobile {
        display: flex;
        align-items: center;
    }

    .offline-status-button {
        color: white;
        --wa-color-neutral-40: white;
        --wa-color-brand-40: white;
    }

    .offline-status-button::part(base) {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .account-menu-trigger {
        width: 2.25rem;
        height: 2.25rem;
        --wa-color-focus: rgba(255, 255, 255, 0.45);
        --wa-color-neutral-70: black;
        --wa-color-neutral-30: white;
    }

    .account-menu-trigger-signed-out {
        --wa-color-focus: rgba(255, 255, 255, 0.45);
        --wa-color-neutral-30: white;
        --wa-color-brand-40: white;
    }

    .account-menu-trigger::part(base) {
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        border-radius: 999px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .account-menu-trigger-signed-out::part(base) {
        border-radius: 999px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .account-menu-trigger-signed-out:hover::part(base),
    .account-menu-trigger-signed-out:focus-within::part(base) {
        color: white;
        background: rgba(255, 255, 255, 0.12);
    }

    .account-menu-trigger-signed-out:active::part(base) {
        background: rgba(255, 255, 255, 0.2);
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

        wa-icon {
            color: white;
            font-size: 1.5em;
        }
    }

    .account-menu-trigger-signed-out {
        display: flex;
        align-items: center;
        justify-content: center;

        wa-icon {
            color: white;
            font-size: 1.5em;
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
            display: flex;
            flex-wrap: wrap;
            height: auto;
            padding: var(--wa-space-s) 0;
        }

        .nav-center {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
        }

        .nav-left {
            width: 100%;
            justify-content: space-between;
        }

        .app-name {
            display: inline;
        }

        .offline-desktop {
            display: none;
        }

        .offline-mobile {
            display: flex;
        }

        .nav-left-right-group {
            display: flex;
        }

        .menu-toggle {
            display: inline-flex;
        }

        .menu-toggle {
            display: inline-flex;
        }

        .nav-links,
        .nav-search-desktop,
        .nav-right {
            display: none;
            width: 100%;
        }

        .nav-links.open,
        .nav-search-mobile.open,
        .nav-right.open {
            display: flex;
        }

        .nav-search-mobile.open {
            width: 100%;
            padding: var(--wa-space-s) 0;
        }

        .nav-search-mobile.open wa-input {
            width: 100%;
        }

        .nav-links.open {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--wa-space-xs);
            padding: var(--wa-space-s) 0;
        }

        .nav-right.open {
            padding-bottom: var(--wa-space-s);
        }
    }
`;