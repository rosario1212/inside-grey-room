# Inside Grey Room — Commercial release runbook

Last reviewed: 29 September 2026

This document is the source of truth for taking the current Inside Grey Room codebase from release candidate to a commercially distributable App Store / Google Play build without expanding gameplay.

## Current release baseline

- Product version: `12.9.0`
- Permanent mobile identifier: `com.insidegreyroom.game`
- Android: compile/target SDK 36, min SDK 24
- iOS: deployment target 15.0+, submission toolchain Xcode 26+ / iOS 26 SDK+
- Native shell: Capacitor 8.5.2
- Backend: Supabase, shared with web/PWA
- Advertising SDKs: none
- In-app purchases/subscriptions: none
- Live camera/microphone: optional WebRTC, not recorded by Inside Grey Room
- User safety: Terms gate, block/report flows, support and account deletion paths

The absence of ads or in-app purchases does not prevent commercial distribution. The stores can distribute the app for free or at an upfront store price without adding an in-app billing SDK. Any future sale of digital features, subscriptions or virtual goods inside the app must be implemented with the applicable store billing rules before shipping that monetization.

## Automated gates already in the repository

Run:

```bash
npm run store:check
```

The `Store Readiness` GitHub Actions workflow runs the same gate on pull requests and on `main`. It validates the permanent app IDs, Android API 36 baseline, iOS release baseline, legal/support/deletion surfaces, Apple privacy manifest, app icon source and basic privileged-secret leakage indicators.

Android and iOS native build workflows must also remain green before any store upload.

## Release gates that require a human or store account

### Google Play

1. Have an active Google Play Console developer account and finish developer identity/contact verification.
2. Decide the permanent public app name and confirm `com.insidegreyroom.game` before the first production upload.
3. Create and securely back up the Android upload keystore.
4. Add the four GitHub repository secrets used by `Android Play Bundle`:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
5. Run the `Android Play Bundle` workflow and upload the resulting signed `.aab` to Internal testing first.
6. Complete App content, Data Safety, target audience, ads declaration and IARC content rating from the actual final build.
7. Set the public privacy-policy URL and account-deletion URL to the production-domain versions of `privacy.html` and `delete-account.html`.
8. Test the Play-delivered build on at least one recent Android device and one older supported device.
9. Promote Internal -> Closed testing -> Production only after the multiplayer/reconnection checklist passes.

### Apple App Store

1. Have an active Apple Developer Program membership and finish App Store Connect agreements, banking/tax details if the app will be paid.
2. Create the App Store Connect app with bundle ID `com.insidegreyroom.game`.
3. On a Mac with Xcode 26+, select the correct Apple Developer Team and create a Release archive.
4. Validate the archive in Xcode Organizer, then upload it to TestFlight.
5. Complete App Privacy, age rating, App Review Information and export-compliance answers from the final build.
6. Set the production privacy-policy and support URLs.
7. Test the TestFlight build on at least one recent physical iPhone and one older supported iPhone.
8. Submit the tested TestFlight build to App Review only after the multiplayer/reconnection checklist passes.

## Mandatory real-device release test

Use the store-delivered candidate, not only an Android Studio/Xcode debug build.

A four-player mixed-device session should cover the whole loop:

`door -> room creation -> join by code -> role selection -> automatic role assignment for non-selectors -> role acknowledgement -> briefing -> investigation -> special actions -> messages/interrogation -> provisional verdict -> final lock -> reveal -> victory/strength -> next-scenario vote -> next-role priority -> next game`

During the same session deliberately test:

- app background/foreground;
- phone lock/unlock;
- Wi-Fi <-> cellular hand-off;
- temporary connectivity loss and reconnection;
- refresh/reopen without losing the room;
- camera/microphone allow and deny flows;
- audio resume without overlap;
- double taps/double submits;
- player departure and return;
- report and block;
- support request;
- profile recovery;
- permanent profile deletion.

Any data leak of a secret role, canonical truth, future event, protected card or another player's private state is a production blocker.

## Commercial/legal information still requiring the publisher's decision

Before public release, the public legal/store surfaces must identify the actual publisher/controller and provide the required public contact details. Do not invent these values in code. Confirm:

- publisher/developer legal name (individual or company);
- public support/privacy contact email;
- production domain to use for Privacy, Support, Terms and Account Deletion;
- countries/regions of distribution;
- free vs paid-upfront launch;
- whether future in-app purchases/subscriptions are planned.

If distribution includes jurisdictions with additional consumer/privacy requirements, have the final legal text reviewed for those markets before a paid commercial launch.

## Go / no-go rule

Production submission is GO only when all of the following are true at the same commit:

- Store Readiness CI: green
- Android Build Check: green
- iOS Build Check: green
- Cloudflare production deployment: green
- signed Play AAB accepted by Internal testing
- TestFlight build accepted and installed
- complete mixed-device multiplayer release test: pass
- store privacy/safety declarations match actual behavior
- screenshots/icon/listing are final
- publisher identity/contact and legal URLs are final

Until then the build is a release candidate, not a production release.
