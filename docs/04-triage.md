# Triage screen

The agent reviews photos in batches of 20 and suggests one mode per photo, with a short reason. The user can change any suggestion before applying the batch. Nothing changes until they tap Apply.

## Layout

- A grid of 20 photos. Each one has a chip with its suggested mode.
- Tapping a photo opens it full screen, with a before-and-after preview and the reason for the suggestion.
- Tapping the chip lets the user pick a different mode.
- "Take a break" stays visible in the footer.

## Batch order

The agent starts with the easiest photos: group shots and scenery. Close-up photos of the two of them come later, after the user has had some practice. A setting lets the user start with the hardest ones instead.

## Suggestion rules

| Situation | Suggested mode | Reason shown to the user |
| --- | --- | --- |
| Your children are in the photo with [name] | Fade (locked) | "Photos with your children are only faded unless you choose otherwise." |
| [name] is near the edge of the frame | Crop | "They're near the edge, so a crop keeps the moment." |
| Group photo with friends | Erase | "Everyone else in this photo stays as they are." |
| Scenery or a simple background behind [name] | Erase | "The background is simple enough to fill in." |
| Close-up of the two of you | Replace (silhouette) | "Erasing would leave a big gap. A soft silhouette keeps the shape of the moment." |
| Only [name] is in the photo | Delete | "This photo is only of [name]. It goes to a final review before anything is deleted." |
| Video or Live Photo | Fade | "Video editing is coming later, so this one will be faded for now." |
| The face match is uncertain | Ask | "I'm not sure this is [name]. Is it?" (Yes · No) |

## Batch copy

*At the start of a batch:* "These 20 are from summer 2023. I suggest erasing [name] from 12 scenery shots, cropping 5, and fading 3 that include your kids."

*Before applying:* "Ready to apply? 12 erased, 5 cropped, 3 faded. Your originals are kept, and you can undo any of these later."

**Buttons:** Apply · Review again

*If any photos are marked Delete:* "You marked 2 photos to delete. They'll go to a final review before anything is removed."

**Buttons:** Review them now · Later

*After about 15 minutes:* "You've been at this for a while. Want to keep going, or pick this up another day?"

**Buttons:** Keep going · Done for today
