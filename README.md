# Ex-eraser photo app

A photo app that helps people keep their good memories after a breakup while seeing less of their ex. The MVP is a portfolio concept for conversation design and agentic AI. The final version is planned as an App Store product.

The app name is a placeholder, shown in copy as `[App]`. The tone is healing: calm, steady and neutral about the person.

## What it does

The user chooses a person. The app finds their photos with on-device face matching and suggests one of five modes for each photo:

| Mode | What happens |
| --- | --- |
| Fade | Photos stop appearing in Memories, widgets and slideshows. Nothing is edited. |
| Crop | The person is trimmed out of the frame. |
| Erase and fill | AI removes the person and rebuilds the background. |
| Replace | The person is swapped for a silhouette, the user's pet or a calm everyday object. |
| Delete | The photo is removed after a final review, and stays recoverable for 30 days. |

Originals are always kept, every edit is labeled in the photo's metadata, and face data never leaves the phone.

## Repo contents

### Product
- [Product plan](docs/01-product-plan.md): landscape, platform constraints, modes, edit labeling and hard cases
- [Voice and journey](docs/02-voice-and-journey.md): voice principles and the onboarding flow diagram
- [Partner integrations](docs/11-partner-integrations.md): connecting to print services like CVS, Walgreens and Shutterfly

### Conversation design and copy
- [Onboarding](docs/03-onboarding.md): the eight-step script and the "How does it work?" explainer
- [Triage screen](docs/04-triage.md): batch review, suggestion rules and batch copy
- [Replace picker](docs/05-replace-picker.md)
- [The vault](docs/06-vault.md)
- [Settings](docs/07-settings.md)
- [Return visits and notifications](docs/08-return-visits.md)
- [Error and empty states](docs/09-error-states.md)
- [Accessibility pass](docs/10-accessibility.md)

### Agent
- [Suggestion agent instructions](agent/suggestion-agent-prompt.md)
- [Eval plan](agent/eval-plan.md)

### Portfolio
- [Case study](case-study.md)
- [Open questions](docs/open-questions.md)

## Next to write

- [ ] A clickable prototype of onboarding and triage
- [ ] A usability test plan for the check-in and triage copy
- [ ] App Store listing copy and the App Privacy details
