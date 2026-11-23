# Ex-Eraser Photo App

A photo app that helps people keep their good memories after a breakup while seeing less of their ex. The MVP is a portfolio concept for conversation design and agentic AI. The final version is planned as an App Store product.

The tone is healing: calm, steady and neutral about the person.

## What it does

The user chooses a person. The app finds their photos with on-device face matching and suggests one of five modes for each photo:

| Mode | What happens |
| --- | --- |
| Fade | Photos stop appearing in Memories, widgets and slideshows. Nothing is edited. |
| Crop | The person is trimmed out of the frame. |
| Erase and fill | AI removes the person and rebuilds the background. |
| Replace | The person is swapped for a silhouette, the user's pet or a calm everyday object. |
| Delete | The photo is removed after a final review, and stays recoverable for 30 days. |

Originals are always kept, every edit is labeled in the photo's metadata, and face data never leaves the phone. When the user is done, they can print a few favorites for same-day pickup at Walgreens.

## Try the demo

The print step demo runs on your computer. It's in mock mode by default, so no real orders are placed.

1. Install [Node.js](https://nodejs.org) (the LTS version).
2. Download this repo: click the green **Code** button, then **Download ZIP**, and unzip it.
3. Open Terminal, type `cd ` (with a space), drag the `prototype` folder into the Terminal window, and press Return.
4. Type `npm start` and press Return.
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

Press Control + C in Terminal to stop it. More detail, including how to connect to Walgreens, is in the [prototype README](prototype/README.md).

## Repo contents

### Product
- [Product plan](docs/01-product-plan.md): landscape, platform constraints, modes, edit labeling and hard cases
- [Voice and journey](docs/02-voice-and-journey.md): voice principles and the onboarding flow diagram
- [Partner integrations](docs/11-partner-integrations.md): connecting to print services like CVS, Walgreens and Shutterfly
- [Packaging as an app](docs/13-packaging-as-an-app.md): steps from the web demo to the App Store

### Conversation design and copy
- [Onboarding](docs/03-onboarding.md): the eight-step script and the "How does it work?" explainer
- [Triage screen](docs/04-triage.md): batch review, suggestion rules and batch copy
- [Replace picker](docs/05-replace-picker.md)
- [The vault](docs/06-vault.md)
- [Settings](docs/07-settings.md)
- [Return visits and notifications](docs/08-return-visits.md)
- [Error and empty states](docs/09-error-states.md)
- [Accessibility pass](docs/10-accessibility.md)
- [Print step](docs/12-print-step.md)

### Prototype
- [Print step demo](prototype/README.md): a working web demo that sends cleaned-up photos to Walgreens, with a mock mode that needs no credentials

### Agent
- [Suggestion agent instructions](agent/suggestion-agent-prompt.md)
- [Eval plan](agent/eval-plan.md)

### Portfolio
- [Case study](case-study.md)
- [Open questions](docs/open-questions.md)

## Next to write

- [x] A working demo of the print step
- [ ] A clickable prototype of onboarding and triage
- [ ] Outreach to CVS and Shutterfly, using the demo and the case study
- [ ] A usability test plan for the check-in and triage copy
- [ ] App Store listing copy and the App Privacy details
