# Signed-Out Account Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the signed-out account icon visible when its Web Awesome button is hovered or keyboard-focused.

**Architecture:** Override only the signed-out trigger's exposed button base states. Reuse the header's translucent-white treatment and retain the existing white icon, focus token, dropdown markup, and light/dark behavior.

**Tech Stack:** Lit, CSS shadow parts, Web Awesome 3.10, Playwright/Spiderloop

---

## File Structure

- Modify: `src/ClientApp/src/script/components/app-header.styles.ts` — owns signed-out account trigger presentation.

### Task 1: Correct the signed-out trigger states

**Files:**
- Modify: `src/ClientApp/src/script/components/app-header.styles.ts:187-204`

- [ ] **Step 1: Capture the failing hover assertion**

Sign out locally, open any page at `1440 × 900`, hover `.account-menu-trigger-signed-out`, and read the computed background and icon colors.

Expected pre-fix failure:

```text
base background: opaque or nearly opaque white
icon color: white
```

- [ ] **Step 2: Add scoped interactive-state styles**

Extend the signed-out base styles:

```css
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
```

- [ ] **Step 3: Verify pointer, keyboard, and menu behavior**

At desktop and mobile widths, confirm:

```text
hover/focus base background alpha < 0.25
icon color remains white
base remains circular
Enter and click both open the account dropdown
```

Also confirm zero error-level console messages and zero failed same-origin requests.

- [ ] **Step 4: Build and commit**

Run:

```powershell
Push-Location src\ClientApp
npm run build
Pop-Location
dotnet build MessianicChords.sln -c Release --no-restore
```

Expected: both commands exit 0.

Commit:

```powershell
git add -- src\ClientApp\src\script\components\app-header.styles.ts
git commit -m "Fix signed-out account hover contrast" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```
