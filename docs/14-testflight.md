# Sharing a beta with TestFlight

TestFlight is Apple's beta testing service. Once it's set up, anyone can install a test version of Ex-Eraser Photo App from one link: they install the free TestFlight app, tap the link, and tap Install. It's the easiest way to put the app in partners' hands before it's on the App Store.

**Status:** not started. This is a note for later.

## Before you start

TestFlight only distributes real iPhone app builds made in Xcode, so the web demo can't go on TestFlight as it is. You need:

- [ ] **Apple Developer Program membership** ($99 a year). TestFlight is included.
- [ ] **A Mac with Xcode.** Xcode is free from the Mac App Store.
- [ ] **An iPhone app project.** Two options:
  - **Quick partner demo:** a small SwiftUI app with the print step written natively in SwiftUI. This is the safer choice for the beta review (see Risks below) and gives a head start on the real app.
  - **The real app:** the full native app described in [Packaging as an app](13-packaging-as-an-app.md).

## Steps

1. **Create the app record.** In [App Store Connect](https://appstoreconnect.apple.com), go to Apps, click the + button, and enter the name (Ex-Eraser Photo App) and a bundle ID, such as `com.jkelleman.exeraser`.
2. **Upload a build from Xcode.** Choose Product → Archive, then Distribute App → App Store Connect → Upload.
3. **Fill in the test information** on the app's TestFlight tab: a beta app description, a feedback email, and beta app review information. These are required before external testers can join.
4. **Create an external testing group** under External Testing, and add your build to it. The first build goes to Apple for a beta review before testers can install it. Later builds in the group may not need a full review.
5. **Create the public link.** In the group's Testers tab, click Create Public Link, then choose:
   - **Open to Anyone:** anyone with the link can join.
   - **Filter by Criteria:** only testers who meet the device or OS criteria you set can join.
6. **Share the link.** Up to 10,000 external testers can join. You can turn the link off at any time.

## What testers do

1. Install the free **TestFlight** app from the App Store.
2. Tap your public link.
3. Tap **Install**. Updates show up in TestFlight as you upload new builds.
4. Send feedback and screenshots from inside TestFlight. Feedback appears on the TestFlight tab in App Store Connect.

## Two kinds of testers

| | Internal testers | External testers |
| --- | --- | --- |
| Who | Up to 100 people on your App Store Connect team | Up to 10,000 people anywhere |
| How they join | Added to your team in App Store Connect | Email invitation or public link |
| Apple review | Not needed | First build is reviewed |
| Good for | You and close collaborators | Partners like CVS and Shutterfly, and wider testing |

## Risks

- **The beta review uses the App Review Guidelines.** An app that only shows a web page inside it could be turned down under Guideline 4.2, Minimum Functionality. Writing the print step natively in SwiftUI lowers that risk.
- **Demo data.** The beta should use mock mode, or the Walgreens sandbox, until Walgreens approves the app for production. Testers shouldn't be able to place real orders by accident.
- **Privacy.** The beta still needs accurate permission messages and must keep face data on the phone, the same as the final app.

## Checklist for when you're ready

- [ ] Enroll in the Apple Developer Program
- [ ] Build the SwiftUI app with the print step
- [ ] Create the app record in App Store Connect
- [ ] Archive and upload the first build
- [ ] Fill in test information
- [ ] Create an external group and add the build
- [ ] Wait for the beta review
- [ ] Create the public link and share it

## Sources

- [Beta testing made simple with TestFlight](https://developer.apple.com/testflight/) (Apple)
- [Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers) (App Store Connect Help)
- [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview) (App Store Connect Help)
