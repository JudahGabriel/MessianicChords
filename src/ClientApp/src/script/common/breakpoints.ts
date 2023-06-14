import { css, CSSResult, CSSResultGroup, unsafeCSS } from "lit";

/**
 * Mobile breakpoints for minimum device widths. Intended for use in CSS responsive media queries.
 */
export const enum BreakpointMin {
    /**
     * The minimum size for a small device, typically a larger phone such as a modern iPhone. Sizes smaller than this will be considered extra small (xs) device, such as older phones with very small screens.
     */
    sm = 576,
    /**
     * The minimum size for a medium device, typically a tablet.
     */
    md = 768,
    /**
     * The minimum size for a large device, such as a high-end tablet or desktop screen.
     */
    lg = 992,
    /**
     * The minimum size for an extra large device, such as a large desktop screen.
     */
    xl = 1200,
    /**
     * The minimum size for a xxl device, such as a high DPI desktop screen.
     */
    xxl = 1600,
    /**
     * The minimum size for a xxxl device, such as a higher DPI desktop screen.
     */
    xxxl = 1960
}

/**
 * Mobile breakpoints for maximum device widths. Intended for use in CSS responsive media queries.
 */
export const enum BreakpointMax {
    /**
     * Maximum width of an extra small screen, typically a small or old phone.
     */
    xs = 575,
    /**
     * Maximum width of a small screen, typically a newer phone.
     */
    sm = 767,
    /**
     * Maximum width of a medium screen, such as a tablet.
     */
    md = 991,
    /**
     * Maximum width of a large screen, such as a desktop monitor.
     */
    lg = 1199,
    /**
     * Maximum width of a large screen, such as high resolution desktop screens.
     */
    xl = 1599,
    /**
     * Maximum width of a very large screen, such as higher resolution desktop screens.
     */
    xxl = 1959

}

/**
 * Creates a CSS media query for the specified breakpoint size. Meant for use in *.styles.ts files.
 * For example, mediaQuery(BreakpointMin.sm) will create a CSS media query that matches xs and sm screen sizes such as phones.
 * @param size The minimum or maximum size to use for the CSS media query.
 * @returns A CSSResultGroup for use in a *.styles.ts file.
 */
export function mediaQuery(size: BreakpointMin | BreakpointMax | number): CSSResultGroup {
    // Use min-width if it's a BreakpointMin. Otherwise use max-width.
    const minSizes = [BreakpointMin.sm, BreakpointMin.md, BreakpointMin.md, BreakpointMin.lg, BreakpointMin.xl, BreakpointMin.xxl, BreakpointMin.xxxl];
    if (minSizes.includes(size as BreakpointMin)) {
        return css`@media(min-width: ${size}px)`;
    }

    return css`@media(max-width: ${size}px)`;
}

export function mediaQueryMobile(): CSSResultGroup {
    return mediaQuery(BreakpointMax.xs);
}

export function mediaQueryTablet(): CSSResultGroup {
    return mediaQuery(BreakpointMax.md);
}

/**
 * Function that checks for a breakpoint and returns a boolean. Meant for use in regular Typescript code, not in *.style.ts files.
 * @param size The size to check for.
 * @returns Whether the screen size matches.
 */
export function matchesMediaQuery(size: BreakpointMin | BreakpointMax): boolean {
    // Use min-width if it's a BreakpointMin. Otherwise use max-width.
    const minSizes = [BreakpointMin.sm, BreakpointMin.md, BreakpointMin.md, BreakpointMin.lg, BreakpointMin.xl, BreakpointMin.xxl, BreakpointMin.xxxl];
    if (minSizes.includes(size as BreakpointMin)) {
        return window.matchMedia(`(min-width: ${size}px)`).matches;
    }

    return window.matchMedia(`(max-width: ${size}px)`).matches;
}

export function mediaSomeQuery(params = {}): CSSResultGroup {
    let mediaString = "";
    for (const [query, val] of Object.entries(params)) {
        mediaString += mediaString === "" ? "" : " and ";
        mediaString += `(${query}: ${val})`;
    }
    return css`@media${unsafeCSS(mediaString)}`;
}