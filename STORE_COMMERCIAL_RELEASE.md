# Inside Grey Room — Commercial release runbook

Last reviewed: 1 October 2026

This document is the source of truth for taking the current Inside Grey Room codebase from playtest/release candidate to a commercially distributable App Store / Google Play build without expanding gameplay.

## Current release baseline

- Internal product version: `12.9.0` (game/runtime revisions may be newer)
- Permanent mobile identifier: `com.insidegreyroom.game`
- Android: compile/target SDK 36, min SDK 24
- iOS: deployment target 15.0+, submission toolchain Xcode 26+ / iOS 26 SDK+
- Native shell: Capacitor 8.5.2
- Backend: Supabase, shared with web/PWA
- Advertising SDKs: none
- Premium digital content exists: OMERTÀ, HÉRITAGE and other DLC access states
- Native commercial billing: intentionally **not wired yet** during the private playtest phase
- Live camera/microphone: optional WebRTC, not recorded by Inside Grey Room
- User safety: Terms gate, block/report flows, support and account deletion paths

## Web beta vs native store build

The private web/PWA beta can keep owner-issued invite/access codes so external playtesters can receive premium access without a store account.

The native App Store / Google Play bundle is different:

- `scripts/build-mobile.mjs` excludes `dlc-invites-v12-45.js` and `dlc-invites-v12-45.css`;
- the generated native pages contain no reference to that legacy code-unlock UI;
- `native-store-boundary-v14.js` removes any legacy access controls that could be recreated accidentally;
- pre-authorized tester entitlements already stored server-side can still be read by the app;
- public paid entitlements must ultimately come from verified StoreKit / Google Play Billing purchases, not from a code entered in the native app.

Do **not** submit a paid-premium commercial build until the native billing adapter is connected and tested. Apple requires in-app purchase for digital features/content unlocked inside the app and Google Play requires Play Billing for the normal case of digital goods/services distributed through Google Play.

## Automated gates already in the repository

Run:

```bash
npm run store:check
```

The command now builds the actual native `www/` bundle first and then validates it. The `Store Readiness` GitHub Actions workflow runs the same gate on pull requests and on `main`.

The gate checks, among other things:

- permanent app IDs;
- Android API 36 baseline and native hardening;
- iOS release baseline and privacy manifest;
- legal/support/deletion surfaces;
- privileged-secret leakage markers;
- native exclusion of the legacy DLC invite/code unlock module;
- presence of the native commerce boundary.

Android and iOS native build workflows must also remain green before any store upload.

## Account-bound commerce work — intentionally postponed until developer accounts exist

When Apple Developer and Google Play Console are active, implement the store adapter behind `window.IGR_STORE_COMMERCE_ADAPTER`.

Required behavior before commercial submission:

1. Create permanent one-time products for each DLC/premium pack actually sold.
2. Use StoreKit on iOS and Google Play Billing on Android for purchase initiation.
3. Verify purchase/transaction authenticity server-side before granting a Supabase premium entitlement.
4. Make the server entitlement the cross-device source of truth after verification.
5. Implement **Restore Purchases** and test reinstall/new-device recovery.
6. Handle pending, cancelled, refunded/revoked and duplicate transactions safely.
7. Test Apple sandbox/TestFlight and Google Play license-test/internal-test purchases before production.
8. Keep owner/tester codes restricted to the web/private beta path, never as an in-app alternative payment/unlock mechanism in the store builds.

This is currently the principal technical commercial blocker that cannot be validated honestly without the future store products/accounts.

## Versioning for the first public release

The internal package can continue to use the project's current version. Store-facing versions can be set independently:

- Android: `ANDROID_VERSION_NAME=1.0.0` and a monotonically increasing `ANDROID_VERSION_CODE` when needed;
- iOS: `IOS_MARKETING_VERSION=1.0.0` and a monotonically increasing `IOS_BUILD_NUMBER`.

This allows the first public release to be **1.0.0** without renaming the entire internal project history.

## Release gates that require a human or store account

### Google Play

1. Have an active Google Play Console developer account and finish developer identity/contact verification.
2. Confirm `com.insidegreyroom.game` before the first upload; the package/application ID is permanent for that Play app.
3. Create and securely back up the Android upload keystore.
4. Add the four GitHub repository secrets used by `Android Play Bundle`:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
5. Create the in-app products and connect/test Google Play Billing if premium DLC will be sold in the Android app.
6. Run the `Android Play Bundle` workflow and upload the resulting signed `.aab` to Internal testing first.
7. Complete App content, Data Safety, target audience, ads declaration and IARC content rating from the actual final build.
8. Set the public privacy-policy URL and account-deletion URL to the production-domain versions of `privacy.html` and `delete-account.html`.
9. Give review staff any instructions/resources needed to exercise restricted features.
10. Test the Play-delivered build on at least one recent Android device and one older supported device.
11. Promote Internal -> Closed testing -> Production only after the multiplayer/reconnection and purchase/restore checklists pass.
12. If the Play Console account is subject to Google's personal-account production-testing requirement, treat that test period as a launch-calendar requirement rather than a technical bug.

### Apple App Store

1. Have an active Apple Developer Program membership and finish App Store Connect agreements, banking/tax information when required.
2. Create the App Store Connect app with bundle ID `com.insidegreyroom.game`.
3. Create the in-app purchases and connect/test StoreKit if premium DLC will be sold in the iOS app.
4. On a Mac with Xcode 26+, select the correct Apple Developer Team and create a Release archive.
5. Validate the archive in Xcode Organizer, then upload it to TestFlight.
6. Complete App Privacy, the current age-rating questionnaire, App Review Information and export-compliance answers from the final build.
7. Set the production privacy-policy and support URLs.
8. Give App Review a reliable path to evaluate the game; the base game now includes a one-device local mode, which is useful when a full multi-device room is impractical during review.
9. Test the TestFlight build on at least one recent physical iPhone and one older supported iPhone.
10. Submit the tested TestFlight build to App Review only after multiplayer/reconnection and purchase/restore tests pass.
11. If distributing in the European Union, complete the applicable App Store Connect trader-status information before the store workflow requires it.

## Mandatory real-device release test

Use the store-delivered candidate, not only an Android Studio/Xcode debug build.

A mixed-device session should cover the whole applicable loop:

`door -> room creation -> join by code -> role selection -> automatic role assignment for non-selectors -> role acknowledgement -> briefing -> investigation -> special actions -> messages/interrogation -> provisional verdict -> final lock -> reveal -> victory/strength -> next-scenario vote -> next-role priority -> next game`

Also validate the one-device local route independently.

During the same release cycle deliberately test:

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
- permanent profile deletion;
- purchase success/cancel/pending/error;
- Restore Purchases after reinstall or on a second device;
- revoked/refunded entitlement behavior.

Any data leak of a secret role, canonical truth, future event, protected card or another player's private state is a production blocker.

## Commercial/legal information still requiring the publisher's decision

Before public release, the public legal/store surfaces must identify the actual publisher/controller and provide the required public contact details. Do not invent these values in code. Confirm:

- publisher/developer legal name (individual or company);
- public support/privacy contact email;
- production domain to use for Privacy, Support, Terms and Account Deletion;
- countries/regions of distribution;
- free base app + paid DLC versus another launch model;
- final DLC catalogue and prices.

If distribution includes jurisdictions with additional consumer/privacy requirements, have the final legal text reviewed for those markets before a paid commercial launch.

## Go / no-go rule

Production submission is GO only when all of the following are true at the same commit:

- Store Readiness CI: green
- Android Build Check: green
- iOS Build Check: green
- Cloudflare production deployment: green
- signed Play AAB accepted by Internal testing
- required Play production-test period completed, if the developer account is subject to it
- TestFlight build accepted and installed
- complete mixed-device + local-mode release test: pass
- native store billing connected for every premium product exposed in the native app
- purchase + restore + revocation tests: pass
- store privacy/safety declarations match actual behavior
- screenshots/icon/listing are final
- publisher identity/contact and legal URLs are final

Until then the build is a release candidate, not a production release.
