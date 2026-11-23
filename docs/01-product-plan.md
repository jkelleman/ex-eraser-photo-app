# Product plan

## What already exists

The pieces exist, but nobody has combined them into one experience.

- **Apple Photos** lets people choose "Feature This Person Less" or "Never Feature This Person," which keeps someone out of Memories and the Photos widget. Their photos stay in the library unchanged. Apple lists this in its [personal safety guide](https://support.apple.com/guide/personal-safety/ipsa4c9edc62/web), which is a reminder that some users will arrive from a much harder place than a bad breakup.
- **Photoroom and OkCupid** built an ["Ex-Terminator"](https://www.photoroom.com/erase-your-ex) for single photos. They cited an OkCupid survey where 62% of women said they want to erase an ex from their photos ([source](https://www.diyphotography.net/tired-of-your-ex-spoiling-all-your-photos-now-you-can-delete-them-in-an-ai-click/)).
- **Picsart's "AI Replace My Ex"** swaps the person for an object like a red flag or a snake ([source](https://www.entrepreneur.com/business-news/replace-my-ex-tool-uses-ai-technology-to-edit-out-exes/444208)).
- **Removex** and many other person-removal apps work one photo at a time.

The opening is a reversible, library-wide flow designed around how people feel after a breakup.

## Platform constraints

- **Google Photos.** Since March 31, 2025, the Library API only gives apps access to photos they uploaded themselves. Apps that need photos from the user's wider library must use the Picker API, where the user selects items by hand ([source](https://developers.googleblog.com/en/google-photos-picker-api-launch-and-library-api-updates/)). A full-library scan isn't possible.
- **iPhone.** With full photo access, PhotoKit and on-device face clustering can scan the whole camera roll without anything leaving the phone.

**Decision:** build for iPhone first. A Google version would be a "pick an album" flow.

## The five modes

The app offers the full range, as a ladder from gentle to permanent. Users can mix modes photo by photo.

1. **Fade.** Hide their photos from Memories, widgets and slideshows. Nothing is edited.
2. **Crop.** Fast, and it looks natural when the person is near the edge of the frame.
3. **Erase and fill.** AI removes them and rebuilds the background. Works well for travel and scenery shots.
4. **Replace.** Swap them for a silhouette, the user's pet or an everyday object. The app never swaps in another real person, because that creates a memory that never happened and uses someone's face without consent.
5. **Delete.** Never automatic. Always goes through a review screen and a waiting period.

Every edit keeps the original. People get back together, and sometimes they just want the real photo back years later.

## Labeling edits

### Tags by mode

The industry vocabulary is the IPTC Digital Source Type field. `compositeWithTrainedAlgorithmicMedia` means a photo edited with generative AI, such as by inpainting ([source](https://www.iptc.org/std-dev/NewsCodes/treeview/digitalsourcetype-en-GB.html)). Google uses this value and shows it as "Edited with Generative AI" ([source](https://iptc.org/news/google-ai-transparency-based-on-iptc-standards/)).

| Mode | Pixels change? | Tag |
| --- | --- | --- |
| Fade | No | None in the file. The app keeps a private on-device list of hidden photos. |
| Crop | Yes, not generated | Recorded as a crop action, with no AI label |
| Erase and fill | Yes, AI-generated | `compositeWithTrainedAlgorithmicMedia` + C2PA manifest |
| Replace | Yes, AI-generated | Same, plus a note on what was swapped in |
| Delete | File removed | Kept in the vault until the waiting period ends |

### Three layers

Plain metadata is easy to strip. One ExifTool command can delete the field without a trace ([source](https://ppc.land/iptc-metadata/)), and Apple's own Clean Up label isn't kept when an image is shared to other apps ([source](https://9to5mac.com/2024/08/28/ios-18-1-labels-images-clean-up)). So the app stacks three layers:

1. **IPTC field in the XMP metadata.** Cheap and widely readable.
2. **A signed C2PA manifest.** A record of each edit that breaks if tampered with. The official [C2PA iOS library](https://opensource.contentauthenticity.org/docs/c2pa-ios) offers native Swift APIs for signing. For wide trust, products go through a conformance process and get certificates from approved authorities ([source](https://www.digitalapplied.com/blog/apple-reference-image-vs-content-credentials-photo-proof)). A v1 could self-sign and apply later.
3. **An invisible watermark** that survives screenshots and re-saves. Apple now adds a SynthID watermark to most Apple Intelligence edits on Mac ([source](https://support.apple.com/en-az/guide/photos/pht5c38b77c5)). Third-party options need vendor research.

### What iOS already provides

- **Originals.** Edits saved through PhotoKit's editing API keep the original, and "Revert" in Photos still works. The vault sits on top of that.
- **Waiting period.** PhotoKit deletions show a system confirmation and go to Recently Deleted for 30 days. The app's review screen comes first, which gives two safety nets.

## Hard cases

- **Shared children.** If face clustering finds a child together with the person, the photo defaults to Fade only. Other modes need a choice made for that one photo, and bulk actions never apply to it.
- **Shared libraries.** Edits in an iCloud Shared Photo Library sync to everyone in it. If PhotoKit doesn't expose which library a photo belongs to, the safe fallback is to edit a private copy.
- **Biometrics.** Face clustering stays on the device, and face data is erased after every session. This matters for biometric privacy laws such as Illinois's BIPA, and the onboarding copy says it plainly.
- **Misuse.** All three labeling layers, plus recoverable originals. An "export with edit history" option lets a user show what changed if they ever need to.
