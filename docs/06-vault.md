# The vault

The vault is where every change can be seen and undone. It stores photo IDs and edit records only, never face data, which keeps the on-device privacy promise intact.

## Layout

- Filters across the top: All · Faded · Cropped · Erased · Replaced · Deleted.
- Each item shows the edited photo, its mode and the date it changed. Tapping it shows the original side by side.
- Photos with your children show a lock icon.
- Restoring never asks why. People get back together, or they simply want a photo back, and the app treats both the same way.

## Copy

*Header:* "Your originals. Every photo you've changed is kept here, just as it was."

*Empty vault:* "Nothing here yet. When you change a photo, its original is kept here."

*Restore one photo:* "Restore this photo to its original? Your edit will be removed."

**Buttons:** Restore · Cancel

*After restoring:* "Restored. This photo is back to its original."

*Change a past choice:* "Choose a new option for this photo." (Shows the five modes, with the current one selected.)

*Faded photo:* "This photo is hidden from Memories, widgets and slideshows."

**Buttons:** Show it again · Choose another option

*Deleted photo:* "This photo is in Recently Deleted in the Photos app. You can recover it there until [date]."

**Buttons:** Open Photos

*Restore everything for one person:* "Restore all 312 photos of [name]? This undoes every change, including fades."

**Buttons:** Restore all · Cancel

## Open question

PhotoKit doesn't appear to let apps read or recover items in Recently Deleted. If that's confirmed, deleted photos are recovered in the Photos app. The other option is for the app to keep its own copy for 30 days, which uses more storage.
