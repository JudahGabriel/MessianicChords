# Header Avatar Circle Design

## Goal

Restore the signed-in app-header profile image to a true circle after the Web Awesome migration.

## Root Cause

The `.account-menu-trigger` host is `2.25rem` square, but Web Awesome's internal button base retains its default 43px control height. The label and avatar therefore render at 34px by 41px, stretching the square source image into an oval.

## Design

Keep the existing host and image styles. Set the signed-in trigger's `::part(base)` width and height to `2.25rem`, matching the host. The existing label sizing, circular clipping, and `object-fit: cover` will then produce a circular image without affecting other header buttons.

This deliberately scopes the correction to `.account-menu-trigger`; signed-out and fallback account icons retain their current behavior.

## Verification

In an authenticated browser session:

- Confirm the trigger base, label, and image have equal width and height.
- Confirm the avatar remains vertically centered in the desktop and mobile headers.
- Confirm the account menu still opens and the image remains clipped to a circle.
- Run the existing client and solution builds.
