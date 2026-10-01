# Inside Grey Room — Android / Google Play release

## Current mobile stack
- Capacitor 8.5.2
- Node.js 22+
- Android compile/target SDK 36
- Minimum Android SDK 24
- Android application ID: `com.insidegreyroom.game`
- Embedded local web bundle in `www/`
- Supabase remains the shared multiplayer/profile backend
- Private web beta DLC invite/code UI is excluded from the native Play bundle

> The application ID should be changed **before the first Play Store upload** if another permanent package name is desired. Google Play treats the package/application ID as the app's permanent identity.

## Install locally
1. Install Node.js 22 LTS or newer.
2. Install a current Android Studio with Android SDK 36.
3. In the repository root run:

```bash
npm install
npm run android:init
npm run android:open
```

`android:init` builds the production web runtime, creates the native Android project, synchronizes Capacitor and applies Inside Grey Room's Android hardening/permissions.

After the Android project already exists, use:

```bash
npm run android:sync
npm run android:open
```

## Test on Android
From Android Studio choose a physical Android device whenever possible and run the `app` configuration. Validate at minimum:
- intro/door animation;
- create + join lobby;
- one-device local mode;
- cross-play Android ↔ web/PWA;
- background/foreground resume;
- network change Wi-Fi ↔ mobile data;
- camera/microphone permission denial and acceptance;
- WebRTC interrogation;
- audio briefing;
- profiles/friends;
- block + report;
- Terms gate;
- recovery key generation and profile restore;
- in-app permanent profile deletion.

## Build an App Bundle
Local unsigned release bundle:

```bash
ANDROID_VERSION_NAME=1.0.0 ANDROID_VERSION_CODE=1 npm run android:bundle
```

Output:
`android/app/build/outputs/bundle/release/app-release.aab`

For Google Play the upload bundle must be signed. The repository contains a manual GitHub Actions workflow `Android Play Bundle` that signs the AAB when these repository secrets exist:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit the keystore or its passwords.

## Create an upload key
Example on a trusted computer:

```bash
keytool -genkeypair -v -keystore inside-grey-room-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias inside-grey-room-upload
```

Back up this file securely. To create the Base64 GitHub secret on macOS/Linux:

```bash
base64 < inside-grey-room-upload.jks | tr -d '\n'
```

## Premium content / Google Play Billing blocker

Inside Grey Room already has premium DLC/access states. The private web/PWA beta may use owner-issued tester codes, but `scripts/build-mobile.mjs` removes that code-unlock module from the native Android bundle.

Before selling any premium digital pack through the Google Play version:

1. create the corresponding one-time products in Play Console;
2. connect Google Play Billing purchase + restore/query behavior to `window.IGR_STORE_COMMERCE_ADAPTER`;
3. verify purchase tokens server-side before granting the matching Supabase entitlement;
4. correctly handle pending, cancelled, refunded/revoked and duplicate purchases;
5. test with Play license testers/internal testing, including reinstall/new-device restore.

Do not re-enable the legacy DLC invitation/code input as an alternative commercial unlock path inside the Play-distributed app.

## Play Console checklist
### App content
- Privacy policy URL: `/privacy.html` on the production domain.
- Account deletion URL: `/delete-account.html` on the production domain.
- Target audience: do not target children; the in-app gate currently requires 16+.
- Complete the IARC content rating accurately for violence, drugs, suicide themes and user interaction.
- Declare user-generated content/social interaction.
- Declare camera and microphone use for live WebRTC communication.
- Declare whether the app contains ads (current code contains no ad SDK).
- Give reviewers the access instructions/resources required to exercise restricted functionality.

### Data Safety — verify against the final production build
The service currently handles categories including:
- user/profile identifiers (profile UUID, friend code, pseudonym);
- app activity and game progress/statistics;
- user-generated text/messages;
- friends/social graph;
- support and safety reports;
- camera/microphone data used for live WebRTC communication.

The Android Play candidate disables custom profile-photo uploads, but cross-platform server profiles may still contain profile-photo data created on the web. Review the final behavior before answering the Play Data Safety form.

No advertising SDK is currently included and the project does not intentionally sell user data.

## UGC / moderation
Before multiplayer/social upload, the Play readiness layer requires acceptance of Terms and Community Rules. The existing in-game safety system provides blocking and reporting. Reports are stored privately server-side with an `open` moderation state. Moderation must be operational: reports cannot merely be collected and ignored.

## Account/data deletion
- In app: Settings → Account & recovery → Delete permanently.
- Web: `/delete-account.html`.
- A recovery key can restore a profile on a different device.
- Safety/support records may be retained for the limited period disclosed in the privacy policy where needed for abuse prevention/support.

## Before production submission
A successful build does not by itself guarantee Play review approval.

1. Run `npm run store:check` and keep Android CI green.
2. Verify the generated `www/` bundle contains no `dlc-invites-v12-45.js/css` references.
3. If premium products are visible for sale, purchase + restore + revocation tests must pass through Google Play Billing.
4. Run a closed test on real devices.
5. Keep Play Console declarations consistent with the actual final app.
6. Review Google Play policy changes again on the day of submission.
