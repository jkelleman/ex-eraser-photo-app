# Open questions

| Question | Where it comes up | Options |
| --- | --- | --- |
| How does Fade work on iPhone? | [Return visits](08-return-visits.md) | PhotoKit doesn't appear to expose "Feature This Person Less." Hide photos in the Hidden album, or walk the user through Apple's setting. |
| How are deleted photos recovered? | [Vault](06-vault.md) | Recover in the Photos app's Recently Deleted, or keep an app copy for 30 days. |
| Can new photos be found in the background? | [Return visits](08-return-visits.md) | Check on app open, or test a scheduled background task. |
| Does PhotoKit show which library a photo is in? | [Product plan](01-product-plan.md) | If not, always edit a private copy of photos that might be shared. |
| Should grid alt text include captions? | [Accessibility](10-accessibility.md) | Dates only, or on-device image captions. |
| Should a playful tone be offered? | [Settings](07-settings.md) | App Store version only, off by default, with its own copy set. |
| Is the CVS partner program still open? | [Partner integrations](11-partner-integrations.md) | Confirm and apply, or start with Walgreens. |
| Which service is "Babbelfish"? | [Partner integrations](11-partner-integrations.md) | Confirm the name. |
| Which Walgreens credentials endpoint is right? | [Prototype README](../prototype/README.md) | The docs list both `/api/util/v3.0/mweb5url` and `/api/photo/creds/v3`. Confirm with Walgreens. |
| What's the exact Walgreens terms copy? | [Print step](12-print-step.md) | Replace the placeholder checkbox label with the copy Walgreens provides. |
| Can other apps use the Photos People groups? | [Packaging as an app](13-packaging-as-an-app.md) | If not, build face groups with Vision on device and update onboarding step 3. |
| Is there a public API for Clean Up-style erasing? | [Packaging as an app](13-packaging-as-an-app.md) | If not, use an on-device Core ML model. |
