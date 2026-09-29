# Inside Grey Room — Store assets to finalize

The release repository currently contains a 512x512 app icon source (`assets/icon-512-v9.png`). The iOS preparation script can derive a 1024x1024 App Store icon from it, but a commercial release should use a true 1024x1024 master rather than an upscaled 512 source.

## Required before public submission

### Shared
- Final 1024x1024 master app icon, square, no transparency where the store disallows it.
- Screenshots captured from the real final store-delivered build.
- No private player data, real friend codes or unreleased scenario spoilers in marketing screenshots.

### Google Play
- 512x512 high-resolution app icon.
- 1024x500 feature graphic.
- Phone screenshots from the final Android build.
- Optional tablet screenshots only if tablet distribution is intentionally supported and validated.

### App Store
- 1024x1024 App Store icon sourced from the final master artwork.
- iPhone screenshots for the device classes requested by App Store Connect at submission time.
- Screenshots must represent actual in-app UI and behavior.

## Recommended screenshot sequence
1. The Door / entry sequence.
2. Lobby with room code and role selection.
3. Private role card with non-spoiler demo content.
4. Investigation phase.
5. Interrogation / multiplayer interaction.
6. Reveal and strength/result screen.

Do not create fake UI for the listing. Capture the screenshots after the final TestFlight / Play Internal candidate is installed so the marketing material matches exactly what reviewers receive.
