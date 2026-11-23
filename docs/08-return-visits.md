# Return visits and notifications

The app checks for new photos of [name] each time it opens and greets the user based on what it finds. Notifications are off by default. When they're on, they never name the person or show a photo, because a notification about the ex would bring them right back.

## Copy

*New photos found:* "Welcome back. 8 new photos of [name] have shown up since your last visit. Some may be from shared albums. Want to review them?"

**Buttons:** Review now · Later

*Nothing new:* "Welcome back. There's nothing new to review, and your changes are all in place."

**Buttons:** Open the vault · Close

*Back after six months or more:* "It's been a while. Feelings can change over time. Would you like to look over your choices, or keep everything as it is?"

**Buttons:** Look over my choices · Keep as is

*Unfinished batch:* see "Returning after a pause" in [Error and empty states](09-error-states.md).

## Hard dates

Users can add dates that might be difficult, like an anniversary or a birthday. A few days before each one, the app checks in:

"A date you marked is coming up. Want to make sure nothing surprises you in Memories?"

**Buttons:** Check now · Not this time

## Notification rules

| Rule | Detail |
| --- | --- |
| Off by default | The user turns them on in Settings |
| Never names the person | "You have a few new photos to review in [App]." |
| Never shows a photo | No thumbnails or rich previews |
| At most once a week | Batches new photos into one reminder |
| Hard-date check-ins | Only for dates the user added |

## Open questions

- **How Fade works on iPhone.** PhotoKit doesn't appear to expose Apple's "Feature This Person Less" setting. Two options: hide the photos (they move to the Hidden album, out of Memories and the main library), or walk the user through turning on Apple's setting themselves. Both need testing.
- **Background checks.** iOS limits background work, so new photos are probably found when the app opens. Confirm whether a scheduled background task could scan on device overnight.
