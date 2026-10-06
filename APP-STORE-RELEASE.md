Bêta actuelle : version interne v12.11.0 ; version store 1.0.0, build initial 121100. Voir `MOBILE_BETA_RELEASE_V60.md`.

# Inside Grey Room — App Store release candidate

## Native baseline

- Capacitor 8.5.2
- Bundle ID: `com.insidegreyroom.game`
- iOS deployment target: iOS 15.0+
- Submission toolchain: Xcode 26+ / iOS 26 SDK+
- First release target: iPhone (`TARGETED_DEVICE_FAMILY = 1`)
- Internal version currently comes from `package.json`; the public store version can be overridden with `IOS_MARKETING_VERSION` and build number with `IOS_BUILD_NUMBER`
- Camera and microphone usage strings are injected in `Info.plist`
- `PrivacyInfo.xcprivacy` is included in the app resources
- Standard Apple/WebKit encryption only; `ITSAppUsesNonExemptEncryption=false`
- Native background lifecycle releases live media and resynchronizes the room on return
- Local notification permission is opt-in and requested only from the Notifications settings
- Native bundle excludes the private web beta DLC invite/code unlock module

## Build locally on a Mac

Requirements: Node 22+, Xcode 26+ and an Apple Developer account for device signing/distribution.

```bash
npm install
npm run ios:init
npm run ios:open
```

After the first initialization:

```bash
npm run ios:sync
npm run ios:open
```

Unsigned simulator validation:

```bash
npm run ios:sim
```

Example first public version:

```bash
IOS_MARKETING_VERSION=1.0.0 IOS_BUILD_NUMBER=1 IOS_TEAM_ID=YOUR_TEAM_ID npm run ios:archive
```

You can also use **Product > Archive** in Xcode and then **Distribute App > App Store Connect**.

## Premium content / StoreKit blocker

Inside Grey Room already contains premium DLC/access states. The private web/PWA beta may use owner-issued tester codes, but those controls are removed from the Capacitor native bundle.

Before exposing paid premium content in a public App Store build:

1. create the corresponding non-consumable in-app purchases in App Store Connect;
2. connect StoreKit purchase + restore behavior to `window.IGR_STORE_COMMERCE_ADAPTER`;
3. verify transactions server-side before granting the matching Supabase entitlement;
4. handle revoked/refunded transactions;
5. test sandbox/TestFlight purchase and **Restore Purchases** on a second installation/device.

Do not restore the legacy invite-code UI to the native app as an alternate premium unlock path.

## App Store Connect — privacy answers

The native candidate contains no advertising SDK and does not track users across apps or websites.

Declare, matching `PrivacyInfo.xcprivacy` and the actual backend behavior:

- Identifiers > User ID — linked to user — App Functionality
- User Content > Gameplay Content — linked to user — App Functionality
- User Content > Other User Content — linked to user — App Functionality
- User Content > Customer Support — linked to user — App Functionality

Camera/microphone WebRTC media is live-only and is not recorded by Inside Grey Room. Do not declare stored audio/video unless that behavior changes.

## User-generated content / safety

Before release keep all of these functional:

- server-side text filtering for pseudo/messages/support inputs;
- acceptance of Terms + Community Rules before multiplayer/social actions;
- report flow;
- block flow;
- support/contact form;
- moderation review of reports;
- profile photo uploads disabled in the native store candidate until image moderation exists.

## Account lifecycle

The app exposes profile recovery and permanent server-profile deletion from the in-app account center. The public `delete-account.html` path is retained as a second route.

## Review notes

Explain to App Review that Inside Grey Room is a synchronous multiplayer investigation game. The base game also provides a one-device local mode, which gives reviewers a reliable path through a dossier without assembling a full room.

State clearly:

- how to start the local mode;
- how to create a multiplayer room;
- how another device joins with the five-character room code;
- that camera/microphone are optional and only used during a voluntarily activated live interrogation stream;
- that no live media is recorded;
- where Report, Block, Privacy, Support and Delete Account are located;
- that scenarios are fictional and may include mature themes including murder, suicide, drugs, coercion and moral responsibility;
- how premium products are purchased/restored once StoreKit is enabled.

Keep the backend online throughout review. If premium products require a reviewer account or special review instructions, provide them in App Review Information rather than adding a secret unlock mechanism to the app.

## Age rating

Complete Apple's current age-rating questionnaire in App Store Connect based on the real scenario content. Do not rely only on the in-app 16+ confirmation; the App Store rating must independently reflect violence, death/suicide references, drugs and unrestricted user communication.

## Release checklist

1. `npm run store:check` green.
2. Android and iOS CI green.
3. Test on at least one recent physical iPhone and one older supported iPhone.
4. Test deny/allow flows for camera, microphone and notifications.
5. Test background/foreground during a room and during an interrogation.
6. Test Wi-Fi <-> cellular reconnection.
7. Test report, block, friend request, profile recovery and permanent deletion.
8. Check every legal/support URL from the native app.
9. If premium products are exposed: purchase, cancel, restore, reinstall and refund/revocation behavior all pass.
10. Check that the final native bundle contains no legacy DLC invite/code UI.
11. Run Xcode Organizer validation on the final archive.
12. Complete Privacy, Age Rating, IAP metadata and App Review Information in App Store Connect.
13. Upload through Xcode Organizer/TestFlight before production review.
