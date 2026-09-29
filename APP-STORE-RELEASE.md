# Inside Grey Room — App Store release candidate

## Native baseline

- Capacitor 8.5.2
- Bundle ID: `com.insidegreyroom.game`
- iOS deployment target: iOS 15.0+
- Submission toolchain: Xcode 26+ / iOS 26 SDK+
- First release target: iPhone (`TARGETED_DEVICE_FAMILY = 1`)
- App version/build are generated from `package.json` (v12.9.0 -> build 120900 unless `IOS_BUILD_NUMBER` overrides it)
- Camera and microphone usage strings are injected in `Info.plist`
- `PrivacyInfo.xcprivacy` is included in the app resources
- Standard Apple/WebKit encryption only; `ITSAppUsesNonExemptEncryption=false`
- Native background lifecycle releases live media and resynchronizes the room on return
- Local notification permission is opt-in and requested only from the Notifications settings

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

Archive after selecting the Apple Developer Team in Xcode:

```bash
IOS_TEAM_ID=YOUR_TEAM_ID npm run ios:archive
```

You can also use **Product > Archive** in Xcode and then **Distribute App > App Store Connect**.

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

Explain to App Review that Inside Grey Room is a synchronous multiplayer investigation game. Core rooms normally require several real participants. State clearly:

- how to create a room;
- how another device joins with the five-character room code;
- that camera/microphone are optional and only used during a voluntarily activated live interrogation stream;
- that no live media is recorded;
- where Report, Block, Privacy, Support and Delete Account are located;
- that scenarios are fictional and may include mature themes including murder, suicide, drugs, coercion and moral responsibility.

Keep the backend online throughout review. If Apple requests a self-contained review path, prepare a fully featured review/demo environment rather than shipping a public beta mode.

## Age rating

Complete Apple's current age-rating questionnaire in App Store Connect based on the real scenario content. Do not rely only on the in-app 16+ confirmation; the App Store rating must independently reflect violence, death/suicide references, drugs and unrestricted user communication.

## Release checklist

1. Android and iOS CI green.
2. Test on at least one recent physical iPhone and one older supported iPhone.
3. Test deny/allow flows for camera, microphone and notifications.
4. Test background/foreground during a room and during an interrogation.
5. Test Wi-Fi <-> cellular reconnection.
6. Test report, block, friend request, profile recovery and permanent deletion.
7. Check every legal/support URL from the native app.
8. Run Xcode Organizer validation on the final archive.
9. Complete Privacy, Age Rating and App Review Information in App Store Connect.
10. Upload through Xcode Organizer/TestFlight before production review.
