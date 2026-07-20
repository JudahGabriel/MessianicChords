# Dark Mode Readability Design

## Goal

Fix the signed-out account trigger's white-on-white hover state and make every reachable site page readable in dark mode without redesigning the existing brand.

## Scope

The work has two independently verifiable passes:

1. Correct the signed-out app-header account trigger's hover and keyboard-focus states.
2. Establish readable dark-mode color semantics and fix route-specific contrast defects discovered by Spiderloop.

Theme activation remains automatic through `prefers-color-scheme`. This work does not add a theme switcher or change light-mode styling.

## Header Account Trigger

The signed-out trigger currently makes Web Awesome's quiet hover fill white while its icon is also white. Keep the icon white and override only the trigger's interactive base states with the header's existing translucent-white treatment. Preserve a circular shape, visible keyboard focus, and the current menu behavior.

## Dark-Mode Foundation

Keep Web Awesome's `wa-dark` class as the theme source. Introduce shared app-level semantic colors for:

- page text and muted text;
- brand-colored headings and links;
- borders and elevated surfaces;
- placeholders and secondary controls.

In dark mode, the deep navy brand color must shift to a lighter lavender derived from the existing palette so it remains recognizably Messianic Chords while meeting WCAG AA contrast. Normal text targets at least 4.5:1 contrast and large text or non-text UI boundaries target at least 3:1.

Shared tokens should correct repeated problems first. Route-specific styles are changed only when a hard-coded color or component override still fails the audit. Yellow highlight surfaces and chord-chart semantic colors must retain their meaning and sufficient foreground contrast.

## Route Audit

Use Spiderloop automation with forced dark color scheme for every configured route. Include `/chordsheets/8971-b` as the primary chord-detail example and cover both signed-out and available signed-in account states.

For each route:

- capture an accessibility snapshot;
- detect error-level console messages and failed same-origin requests;
- calculate foreground/background contrast for visible text;
- inspect screenshots for text, links, controls, borders, cards, dialogs, menus, and empty/error states;
- check the Spiderloop responsive viewport matrix for clipping, overlap, and horizontal scrolling.

Fix all reproducible readability defects in source and rerun the affected route before continuing. Unreachable authorization-dependent pages may be verified in their rendered redirect or access-denied state; they must not be bypassed with fabricated data.

## Change Boundaries

- Do not alter layout, typography, content, or application behavior.
- Prefer shared semantic tokens over duplicated page overrides.
- Do not use filters or blanket color inversion.
- Do not weaken light-mode contrast.
- Commit the account hover fix separately from dark-mode changes.

## Verification

- The signed-out account icon remains visible on hover and keyboard focus, and its dropdown still opens.
- Every reachable configured route passes the dark-mode readability audit at all Spiderloop viewport widths.
- `/chordsheets/8971-b` has readable title, metadata, chord chart, toolbar, comments, and controls.
- Client and solution builds complete successfully.
