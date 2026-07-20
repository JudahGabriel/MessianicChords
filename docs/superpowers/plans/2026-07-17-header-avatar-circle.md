# Header Avatar Circle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the signed-in app-header profile image render as a true circle after the Web Awesome migration.

**Architecture:** Correct the geometry at the migrated Web Awesome button's exposed base part. Scope fixed square dimensions to `.account-menu-trigger::part(base)` so the existing label, clipping, and image styles inherit square geometry without changing other header controls.

**Tech Stack:** Lit, TypeScript, CSS shadow parts, Web Awesome 3.10, Playwright/Spiderloop, Vite, .NET

---

## File Structure

- Modify: `src/ClientApp/src/script/components/app-header.styles.ts` — owns app-header layout and signed-in avatar trigger styling.
- No new production or test files. The project has no component-level visual test harness; the regression check uses the authenticated local page through Spiderloop.

### Task 1: Make the signed-in avatar base square

**Files:**
- Modify: `src/ClientApp/src/script/components/app-header.styles.ts:193-198`

- [ ] **Step 1: Capture the failing geometry**

Open `http://localhost:5050/account` in the existing authenticated Spiderloop browser session at a `1440 × 900` viewport. Measure `.account-menu-trigger`, its `::part(base)`, its `::part(label)`, and `.avatar-image`.

Expected pre-fix result:

```text
trigger: 36 × 36
base: 36 × 43
label: 34 × 41
image: 34 × 41
```

The unequal image dimensions confirm the oval regression.

- [ ] **Step 2: Add explicit square base dimensions**

Update the existing rule in `src/ClientApp/src/script/components/app-header.styles.ts`:

```css
.account-menu-trigger::part(base) {
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border-radius: 999px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
```

- [ ] **Step 3: Verify desktop geometry and behavior**

Reload `http://localhost:5050/account` at `1440 × 900` and measure the same four layers.

Expected post-fix result:

```text
trigger width == trigger height
base width == base height
label width == label height
image width == image height
```

Also confirm the avatar center matches the header's vertical center, the image is visibly circular, and activating the trigger still opens the account menu.

- [ ] **Step 4: Verify mobile geometry and behavior**

Resize the authenticated page to `390 × 844`, reload it, and repeat the geometry and menu checks.

Expected: every avatar layer remains square, the avatar is vertically centered, circular clipping is intact, and the account menu opens.

- [ ] **Step 5: Run the client build**

Run:

```powershell
Set-Location src\ClientApp
npm run build
```

Expected: TypeScript and Vite complete successfully with exit code 0.

- [ ] **Step 6: Run the solution build**

Run from the repository root:

```powershell
dotnet build MessianicChords.sln -c Release
```

Expected: build succeeds with 0 errors.

- [ ] **Step 7: Commit the isolated fix**

```powershell
git add -- src\ClientApp\src\script\components\app-header.styles.ts
git commit -m "Fix signed-in header avatar shape" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```
