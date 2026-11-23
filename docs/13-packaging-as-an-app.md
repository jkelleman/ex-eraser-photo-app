# Packaging as an app

This guide covers how to go from the web demo to a real iPhone app in the App Store, for someone doing it for the first time.

## Native app or wrapped web app?

The real app should be a **native iPhone app**, built in Xcode with Swift and SwiftUI.

- **Photo access.** The core features (finding a person across the library, editing photos in place, keeping originals, hiding photos) all use Apple's PhotoKit, which works fully only in native apps.
- **On-device processing.** Face matching and erasing need Apple frameworks like Vision and Core ML on the phone, which keeps the privacy promise.
- **App Review.** Apps that mostly show a website inside an app are often rejected under App Store Review Guideline 4.2, Minimum Functionality.

The web demo stays useful as a partner demo and a design reference. The flows, copy, Walgreens integration and eval plan all carry over.

## Steps

### 1. Set up

- **A Mac with Xcode.** Xcode is free from the Mac App Store.
- **An Apple Account with two-factor authentication.**
- **Apple Developer Program membership** when you're ready to test with others or publish. It costs $99 a year. You can build and run the app on your own iPhone before joining.
- **Individual or organization?** As an individual, your legal name shows as the seller on the App Store. To show a company name, you'd enroll as an organization, which needs a legal entity (like an LLC) and a D-U-N-S number.

### 2. Build the app

- Create a new SwiftUI project in Xcode.
- Build the screens from the docs in this repo: onboarding, triage, Replace picker, vault, settings and the print step.
- Key Apple frameworks:
  - **PhotoKit** for reading the library, saving edits with originals kept, and hiding photos
  - **Vision** for detecting faces on the device
  - **Core ML** for on-device erasing and filling
  - **Core Location** for finding nearby stores
- Write the permission messages iOS shows. These are short strings in the app's settings file (Info.plist), and they're copy you write:
  - Photo library: "To find photos of the person you choose, Ex-Eraser Photo App needs access to your library. Face matching happens only on this phone."
  - Location: "Your location is used only to find a nearby Walgreens for your prints."
- Add a privacy manifest file (`PrivacyInfo.xcprivacy`) that lists what data the app uses and why.
- Keep the Walgreens API key on a small server, like the demo's `server.js`, so it isn't stored inside the app.

### 3. Test

- **Simulator.** Xcode includes iPhone simulators for quick checks.
- **Your own iPhone.** Connect it to your Mac and run the app on it.
- **TestFlight.** Apple's beta testing service lets you invite testers by email. It needs the developer membership.
- **Accessibility.** Test with VoiceOver, the largest Dynamic Type sizes and Reduce Motion, using the checklist in the [accessibility pass](10-accessibility.md).
- **The agent.** Run the [eval plan](../agent/eval-plan.md) before each release.

### 4. Prepare the App Store listing

In App Store Connect, Apple's site for managing apps, you'll fill in:

- **Name and subtitle.** The name is Ex-Eraser Photo App. Check that it's free on the App Store before you submit.
- **Description and keywords.**
- **Screenshots** for the required iPhone sizes, and an **app icon**.
- **Category:** Photo & Video.
- **Age rating** questionnaire.
- **Privacy policy URL.** Required. You could host it on your portfolio site or GitHub Pages.
- **App privacy details** (the "nutrition label"). Required for every app. Because face matching stays on the phone, most data isn't collected. Print orders send the user's name, email, phone and chosen photos to Walgreens, so those need to be listed.
- **Support URL.**

### 5. Submit for review

1. In Xcode, archive the app and upload the build to App Store Connect.
2. Pick the build, fill in the listing and submit for review.
3. Add **review notes** that explain the app, how to try each feature and why it needs photo access. Reviewers need a way to test with sample photos.

Rejections are common on a first submission. Apple says what to fix, and you resubmit.

### 6. Release and keep it running

- Choose to release right after approval or on a date you pick.
- Renew the $99 membership each year, or the app comes off the App Store.
- Get Walgreens' approval before turning on live printing in the released app.
- Ship updates through the same build, upload and review cycle.

## Ways to get it built

- **Learn SwiftUI.** Apple's free SwiftUI tutorials are a good starting point.
- **Build with an AI coding assistant.** Work through the app screen by screen, using the docs in this repo as the spec.
- **Work with an iOS developer.** The docs in this repo are already the spec a developer would need.

## Open questions

- **Face groups.** Onboarding step 3 shows face groups from the Photos People album. Check whether PhotoKit gives other apps access to those groups. If it doesn't, the app builds its own face groups with Vision on the device, and the onboarding copy changes to match.
- **On-device erasing.** Check whether Apple offers third-party apps an API for the same kind of cleanup as Photos' Clean Up tool, or whether the app needs its own Core ML model.
