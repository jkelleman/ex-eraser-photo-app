# Partner integrations

## Pitch

[App] helps people keep their good memories after a breakup while seeing less of their ex. Before someone orders prints or builds a photo book, [App] finds the ex in their photos and fades, crops, erases or replaces them. Everything runs on the user's phone, originals are kept, and every edit is labeled.

## Three ways to connect

### 1. Print partner (fastest)

Add a "Print" step after the user finishes a batch, so cleaned-up photos go straight to a print service.

- **CVS Photo.** Third-party print orders to CVS have run through the Kodak Moments Prints partner API program. That's how Google Photos added same-day CVS pickup in 2019 ([source](https://www.chainstoreage.com/technology/cvs-offers-buy-online-print-in-store)). Several apps describe themselves as official CVS Photo partner apps, such as Picta ([source](https://apps.apple.com/app/id1448996015)). Next step: confirm the program is still open and apply.
- **Walgreens.** Walgreens publishes a Photo Prints API that lets third-party apps upload photos, find stores and submit same-day orders ([source](https://developer.walgreens.com/api/photoprints/native)). Since the docs are public, it's a good first integration to build and demo.
- **Shutterfly.** No current public consumer API was found. An old endpoint at ws.shutterfly.com is still listed on RapidAPI ([source](https://rapidapi.com/blog/directory/?p=26570)), but Shutterfly's current integration work runs through its business arm ([source](https://businesssolutions.shutterfly.com/platform/integration-services/)). This is a business-development conversation.

### 2. A feature inside their app (biggest reach, needs a partnership)

License the cleanup flow as a feature in a partner's photo book or print flow, such as "Clean up this photo book before printing." The pitch rests on what makes the design safe: the shared-children default, edit labels, recoverable originals and on-device face matching.

### 3. Prototype first

Build the Walgreens print step in the MVP as proof, then use the working demo and the case study to open conversations with CVS and Shutterfly.

## What changes in the design

- **Privacy promise.** "Nothing is uploaded" becomes "Photos are uploaded only when you order prints, and only the ones you choose." Update the photo access copy and Card 4 of the explainer.
- **Labels on prints.** Metadata doesn't survive printing. Decide whether edited prints carry any label, such as a line on the back, if the partner supports it.
- **Safety rules travel with the order.** Photos with shared children keep their protections in the print step, and face data is never sent to the partner.

## Open question

The user mentioned "Babbelfish" as a possible partner. No photo service by that name was found. Confirm the name.
