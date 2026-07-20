# Dark Mode Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every reachable Messianic Chords page readable in automatic dark mode while preserving light mode and the existing brand.

**Architecture:** Define application semantic colors at document scope so they inherit through Lit shadow roots and track Web Awesome's `wa-light`/`wa-dark` tokens. Replace hard-coded light surfaces and deep-navy dark-mode text with those semantics, while keeping chord sheets paper-like with an explicit dark ink color. Use Spiderloop to verify all configured routes and responsive widths.

**Tech Stack:** Lit, TypeScript, Web Awesome 3.10, CSS custom properties, Playwright/Spiderloop, Vite, ASP.NET

---

## File Structure

- Modify: `src/ClientApp/index.html` — owns document-level brand and app semantic tokens.
- Modify: `src/ClientApp/src/script/common/shared.styles.ts` — owns shared placeholder and component typography behavior.
- Modify: `src/ClientApp/src/script/pages/app-home.styles.ts` — owns home search and navigation colors.
- Modify: `src/ClientApp/src/script/pages/about.styles.ts` — owns the About card surface and text.
- Modify: `src/ClientApp/src/script/pages/account-page.styles.ts` — owns account card surface.
- Modify: `src/ClientApp/src/script/pages/contact-page.styles.ts` — owns contact card surface.
- Modify: `src/ClientApp/src/script/pages/profile-page.styles.ts` — owns profile card surface.
- Modify: `src/ClientApp/src/script/pages/chord-details.styles.ts` — owns paper preview and comments surfaces.
- Modify: `src/ClientApp/src/script/pages/chord-edit-successful.ts` — owns submission-success surface and text colors.
- Modify: `src/ClientApp/src/script/pages/admin-submissions.styles.ts` — owns admin cards, diffs, and secondary text.

### Task 1: Establish inherited app color semantics

**Files:**
- Modify: `src/ClientApp/index.html:58-72`
- Modify: `src/ClientApp/src/script/common/shared.styles.ts:5-13,61-64`

- [ ] **Step 1: Record the failing shared-brand contrast**

Force `prefers-color-scheme: dark`, open `/`, and measure `--theme-color` text against `--wa-color-surface-default`.

Expected pre-fix result:

```text
foreground: rgb(11, 9, 116)
background: rgb(16, 17, 19)
contrast: approximately 1.17:1
```

- [ ] **Step 2: Add document-level semantic tokens**

Add these declarations to the existing `:root` block and add the dark override after it:

```css
:root {
  --theme-color: #0b0974;
  --app-surface: var(--wa-color-surface-raised);
  --app-surface-default: var(--wa-color-surface-default);
  --app-border: var(--wa-color-surface-border);
  --app-text: var(--wa-color-text-normal);
  --app-text-muted: var(--wa-color-text-quiet);
  --app-paper-background: #ffffff;
  --app-paper-text: #212529;
}

:root.wa-dark {
  --theme-color: var(--wa-color-text-link);
}
```

- [ ] **Step 3: Let shared components inherit the document theme**

Remove this declaration from `shared.styles.ts`:

```css
--theme-color: #0b0974;
```

Replace the placeholder rule with:

```css
input::placeholder,
textarea::placeholder {
    color: var(--app-text-muted) !important;
}
```

- [ ] **Step 4: Verify red-green contrast**

Reload `/` in dark mode.

Expected:

```text
--theme-color resolves to Web Awesome's dark link token
normal-size themed text contrast >= 4.5:1
light mode still resolves --theme-color to #0b0974
```

- [ ] **Step 5: Build and commit the foundation**

Run:

```powershell
Push-Location src\ClientApp
npm run build
Pop-Location
```

Expected: exit 0.

Commit:

```powershell
git add -- src\ClientApp\index.html src\ClientApp\src\script\common\shared.styles.ts
git commit -m "Add dark mode color semantics" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Migrate common page surfaces

**Files:**
- Modify: `src/ClientApp/src/script/pages/app-home.styles.ts:46-56`
- Modify: `src/ClientApp/src/script/pages/about.styles.ts:12-29`
- Modify: `src/ClientApp/src/script/pages/account-page.styles.ts:15-20`
- Modify: `src/ClientApp/src/script/pages/contact-page.styles.ts:15-20`
- Modify: `src/ClientApp/src/script/pages/profile-page.styles.ts:15-20`

- [ ] **Step 1: Capture failing page-surface assertions**

In dark mode, verify the home search text uses deep navy and that About, Account, Contact, and Profile cards use a white background with inherited light text.

Expected: at least one normal-size text sample on each affected surface has contrast below 4.5:1.

- [ ] **Step 2: Use the inherited theme in the home search**

Change the search input part to:

```css
#search-box::part(input) {
    width: 100%;
    flex: 1 1 auto;
    min-width: 0;
    color: var(--theme-color);
    text-align: center;
}
```

- [ ] **Step 3: Use semantic About surfaces**

Change the About card and copy declarations to:

```css
.about-card {
    background: var(--app-surface);
    border: 1px solid var(--app-border);
}

.about-copy {
    color: var(--app-text);
}
```

Keep the existing sizing, spacing, radius, and shadow declarations in those rules.

- [ ] **Step 4: Use semantic account, contact, and profile cards**

In each file, replace the card's hard-coded background and border with:

```css
.card {
    background: var(--app-surface);
    border: 1px solid var(--app-border);
}
```

Keep each rule's existing radius, shadow, padding, layout, and gap declarations.

- [ ] **Step 5: Verify affected routes**

In forced dark mode, verify `/`, `/about`, `/account`, `/contact`, and `/profile`.

Expected:

```text
all visible normal text >= 4.5:1
all visible large text and control boundaries >= 3:1
light-mode screenshots retain their existing appearance
```

- [ ] **Step 6: Build and commit common surfaces**

Run `npm run build` from `src\ClientApp`; expect exit 0.

Commit:

```powershell
git add -- src\ClientApp\src\script\pages\app-home.styles.ts src\ClientApp\src\script\pages\about.styles.ts src\ClientApp\src\script\pages\account-page.styles.ts src\ClientApp\src\script\pages\contact-page.styles.ts src\ClientApp\src\script\pages\profile-page.styles.ts
git commit -m "Fix dark mode page surfaces" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Correct chord-detail reading surfaces

**Files:**
- Modify: `src/ClientApp/src/script/pages/chord-details.styles.ts:271-291,433-443`

- [ ] **Step 1: Capture the failing chord-sheet assertion**

Open `/chordsheets/8971-b` in dark mode and measure `.plain-text-preview` and `.plain-text-preview .chord`.

Expected pre-fix result:

```text
preview background: white
preview foreground: inherited near-white
contrast: approximately 1.12:1
```

- [ ] **Step 2: Preserve the paper preview with explicit ink**

Add the semantic paper colors to `.plain-text-preview`:

```css
.plain-text-preview {
    color: var(--app-paper-text);
    background-color: var(--app-paper-background);
}
```

Keep the existing white-space, padding, dimensions, font, overflow, and responsive declarations.

- [ ] **Step 3: Make comments theme-aware**

Change `.comments-scroll` to:

```css
.comments-scroll {
    border: 1px solid var(--app-border);
    background-color: var(--app-surface);
    color: var(--app-text);
}
```

Keep its existing radius, padding, sizing, overflow, and margin declarations.

- [ ] **Step 4: Verify the complete example route**

At every Spiderloop viewport width, verify `/chordsheets/8971-b`:

```text
title and artist contrast >= 4.5:1 unless large text qualifies for 3:1
lyrics and chords use dark ink on white paper
toolbar icons and borders remain visible
sidebar cards, tabs, tags, comments, and controls remain readable
no horizontal scrollbar or blocked controls
```

- [ ] **Step 5: Build and commit chord details**

Run `npm run build` from `src\ClientApp`; expect exit 0.

Commit:

```powershell
git add -- src\ClientApp\src\script\pages\chord-details.styles.ts
git commit -m "Fix dark mode chord sheet contrast" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Correct success and admin semantic surfaces

**Files:**
- Modify: `src/ClientApp/src/script/pages/chord-edit-successful.ts:23-64`
- Modify: `src/ClientApp/src/script/pages/admin-submissions.styles.ts:14-253`

- [ ] **Step 1: Capture failing success and admin assertions**

Open `/chordsheets/new/success`, `/chordsheets/8970-c/edit/success`, and `/admin/submissions` in dark mode.

Expected: deep brand text or inherited light text fails against hard-coded white/light card and diff surfaces.

- [ ] **Step 2: Make the success card semantic**

Use these declarations:

```css
.success-card {
    border: 1px solid var(--wa-color-brand-border-normal);
    background: linear-gradient(160deg, var(--app-surface) 0%, var(--wa-color-brand-fill-quiet) 100%);
}

.badge {
    color: var(--wa-color-brand-on-quiet);
    background: var(--wa-color-brand-fill-quiet);
    border: 1px solid var(--wa-color-brand-border-normal);
}

p {
    color: var(--app-text-muted);
}
```

Keep all existing geometry, typography, and shadows.

- [ ] **Step 3: Make admin neutral and status colors semantic**

Replace hard-coded neutral surfaces and text with:

```css
.submission-card {
    border-color: var(--app-border);
    background: var(--app-surface);
}

.editing-info,
.detail-label,
.chords-diff-label,
.no-changes,
.unchanged-details summary,
.empty-state,
.submitted-date {
    color: var(--app-text-muted);
}

.diff-section-title {
    color: var(--app-text);
}

.diff-table th {
    background: var(--wa-color-neutral-fill-normal);
    border-color: var(--wa-color-neutral-border-normal);
    color: var(--wa-color-neutral-on-normal);
}

.diff-table td {
    border-color: var(--app-border);
}

.diff-new,
.chords-preview {
    background: var(--wa-color-success-fill-quiet);
    color: var(--wa-color-success-on-quiet);
}

.diff-old,
.chords-old {
    background: var(--wa-color-warning-fill-quiet);
    color: var(--wa-color-warning-on-quiet);
}
```

Keep the existing dimensions, grid layout, padding, and overflow behavior.

- [ ] **Step 4: Verify and commit secondary surfaces**

Verify the three routes in dark and light mode, then run `npm run build` from `src\ClientApp`; expect exit 0.

Commit:

```powershell
git add -- src\ClientApp\src\script\pages\chord-edit-successful.ts src\ClientApp\src\script\pages\admin-submissions.styles.ts
git commit -m "Fix dark mode secondary surfaces" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 5: Run the complete Spiderloop dark-mode matrix

**Files:**
- Verify only unless a failing route points to one of the files listed above.

- [ ] **Step 1: Initialize Spiderloop and force dark mode**

Initialize the repository with Spiderloop and configure Playwright with:

```javascript
await page.emulateMedia({ colorScheme: 'dark' });
```

Expected: `<html>` contains `wa-dark` after each navigation.

- [ ] **Step 2: Audit every configured route**

Run these routes at `360×800`, `390×844`, `430×932`, `768×1024`, `1024×768`, and `1440×900`:

```text
/
/browse/newest
/browse/songs
/browse/tags
/browse/artists
/browse/random
/browse/offline
/about
/contact
/account
/chordsheets/new
/chordsheets/new/success
/chordsheets/1011
/chordsheets/8971-b
/artist/Matt%20Redman
/my/starred
/profile
/admin/submissions
/chordsheets/1011/edit
/chordsheets/8970-c/edit/success
/confirmemail
```

For each rendered state, require:

```text
zero error-level console messages
zero failed same-origin requests
non-empty accessibility snapshot
normal text contrast >= 4.5:1
large text and UI boundaries >= 3:1
no horizontal scroll, blocked interaction, clipping, or overlap
```

- [ ] **Step 3: Verify signed-out and signed-in header states**

Verify the signed-out account trigger and the available authenticated profile-image state in dark mode. Do not fabricate authorization for protected routes.

- [ ] **Step 4: Run final builds**

Run:

```powershell
Push-Location src\ClientApp
npm run build
Pop-Location
dotnet build MessianicChords.sln -c Release --no-restore
```

Expected: both commands exit 0.

- [ ] **Step 5: Review final changes**

Run:

```powershell
git status --short
git --no-pager diff --check
git --no-pager log -8 --oneline
```

Expected: no uncommitted production changes, no whitespace errors, and separate commits for hover, semantic foundation, common surfaces, chord details, and secondary surfaces.
