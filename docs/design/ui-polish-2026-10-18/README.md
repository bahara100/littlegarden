# Garden UI polish

Updated the existing game UI after Claude's region, season, music and friend-action additions. Changes live in `apps/client/src/garden-ui.css`, imported after the original stylesheet so the existing implementation stays available.

- Warm cream/sage surfaces, clearer text contrast and button hierarchy.
- Sprite portraits in friend selection and the selected character card.
- Compact status tiles and grouped affection/equipment/free-play actions.
- Native, keyboard-accessible collapsible scene settings; the original inputs and event bindings remain.
- Clearer region/season/music controls, full-width menu items, correct stacking above the music bar, and a static readable no-track label.
- Responsive desktop/mobile layout, editor controls, help access and backup actions.

`main.ts` changes are limited to UI presentation: stylesheet import, portrait data attributes, descriptive text and the no-track label class. Game rendering, approved sprites, saves and simulation are unchanged. Momo/Lulu V5 remains the approved art reference; the game's separate V2 choice is preserved.

Validation: `npm.cmd run build` passed. Browser checked the default desktop viewport and 390×844, region/season menu placement, editing/cancel, scene-settings disclosure and the existing action controls. No placement was applied and no save was replaced. Temporary viewport override was reset.

Screenshots: `current.jpg` (default viewport), `mobile.jpg` (390px responsive view).
