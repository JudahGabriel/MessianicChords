# Web Awesome Migration Design

## Goal

Migrate Messianic Chords from Shoelace 2.20.1 to Web Awesome while preserving existing behavior and visual intent. Apply only migration-required changes, one mechanical pass per commit, using the Web Awesome migration guide as the source of truth.

## Package and Loading

- Replace `@shoelace-style/shoelace` with `@awesome.me/webawesome`.
- Update cherry-picked component imports to Web Awesome component paths.
- Replace Shoelace CDN theme styles in the Vite and ASP.NET entry points with Web Awesome styles.
- Use the Shoelace-compatible Web Awesome theme and palette as the initial visual baseline.

## Mechanical and Component Migration

- Rename `sl-` elements, events, theme classes, TypeScript event classes, and `--sl-` custom properties to their Web Awesome forms.
- Apply component-specific API changes from the migration guide, including `primary` to `brand`, `prefix`/`suffix` to `start`/`end`, `help-text` to `hint`, boolean appearance attributes, and native event names.
- Replace static `sl-alert` elements with `wa-callout`. The project has no `toast()` usage, so Web Awesome Pro is not required.
- Replace removed `sl-icon-button` elements with accessible `wa-button` elements containing one `wa-icon`.
- Collapse Shoelace dropdown/menu markup into Web Awesome dropdown items.
- Apply renamed components only where they occur.

## Local Icons

Override Web Awesome's `default` icon library with a custom resolver that maps icon names to `/assets/icons/<name>.svg`. This preserves existing icon names, requires no `library` attribute at each call site, and keeps icon delivery local.

Download the two referenced assets missing from the repository:

- `https://icons.getbootstrap.com/assets/icons/exclamation-triangle.svg`
- `https://icons.getbootstrap.com/assets/icons/exclamation-octagon.svg`

## Theme and Forms

- Map Shoelace tokens to Web Awesome semantic tokens, including primary-to-brand, abbreviated spacing and font sizes, consolidated shadows, form-control tokens, and inverted color tint numbering.
- Remove form serialization shims made obsolete by native form association.
- Ensure every migrated form control has an appropriate `name`.
- Rename validation events and preserve existing validation behavior.

## Verification and Commits

Create one commit for each migration pass:

1. Package and import swap.
2. Mechanical prefix renames.
3. Component API and local icon migration.
4. Theme token migration.
5. Native form migration.

After each pass, run the existing client build/typecheck and ESLint checks, plus applicable solution build checks. Do not commit a failing pass. After all passes, run Spiderloop browser gates across detected routes and viewports, then search for remaining `sl-`, `--sl-`, Shoelace package references, and quoted Shoelace event names.

Manual verification must explicitly cover event listeners, renamed CSS parts, light/dark classes, and local icon rendering.
