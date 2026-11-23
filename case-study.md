# Case study: Ex-Eraser Photo App

Conversation design for a photo app that helps people keep their good memories after a breakup while seeing less of their ex. This is a portfolio concept, with an App Store release planned.

## The problem

After a breakup, photo apps keep bringing the ex back through Memories, widgets and slideshows. People want to keep trips, graduations and nights out with friends, without seeing that one person every time. Today's tools edit one photo at a time, and the built-in settings only hide a person from featured content. In an OkCupid survey, 62% of women said they want to erase an ex from their photos ([source](https://www.diyphotography.net/tired-of-your-ex-spoiling-all-your-photos-now-you-can-delete-them-in-an-ai-click/)).

## My role

Conversation and content designer. I defined the product scope, wrote the onboarding conversation, designed the agent's suggestion logic, and wrote every error, empty, vault and settings state.

## Design principles

- **Healing tone.** Calm and steady, neutral about the person, no jokes at anyone's expense.
- **The user sets the pace.** Every screen offers a way to pause.
- **Nothing is permanent by surprise.** Originals are kept, and deletes get a final review and a 30-day recovery window.
- **Privacy said plainly.** Face matching stays on the phone, and the copy says so every time it matters.

## Key decisions

| Decision | Why |
| --- | --- |
| Five modes, from Fade to Delete | Different photos call for different amounts of change |
| A check-in about how the user feels | People who need a break are offered Fade first and can stop early |
| Easiest photos first | Builds confidence before the close-ups |
| Shared children default to Fade only, never in bulk | A co-parent shouldn't disappear from a child's photos by accident |
| Every edit labeled in the photo's metadata | Guards against edited photos being used to mislead |
| On-device face matching, face data erased each session | Respects biometric privacy laws such as Illinois's BIPA |
| Notifications never name the person or show a photo | A notification about the ex would bring them right back |

## The agent

The agent sorts photos into batches of 20 and suggests a mode for each one, with a one-line reason in plain words. The user can change any suggestion, and nothing happens until they approve the batch. Showing the reasoning keeps the user in control of an emotional decision.

## Constraints that shaped the design

- **Platform access.** Since March 2025, the Google Photos API only lets apps manage photos they uploaded themselves, so the MVP targets iPhone first.
- **Shared libraries.** Edits in an iCloud Shared Photo Library sync to everyone, so the app edits a private copy instead.
- **PhotoKit limits.** How Fade works and how deleted photos are recovered are still open questions to test.

## Quality and accessibility

- **Evaluating the agent.** Human reviewers and an LLM judge grade the agent's suggestions against one rubric. The judge is calibrated against human grades before it's trusted, and the children rule must pass 100% of the time before any release.
- **Accessibility.** The app targets WCAG 2.2 AA. The photo grid, before-and-after preview and face picker each have a non-visual path, and the flow is built to keep cognitive load low for people going through a hard time.

## What's next

- [ ] Prototype the onboarding and triage flows
- [ ] Test the check-in copy with people who've been through a breakup
- [ ] Decide whether to offer a playful tone in the App Store version
