# Accessibility pass

The target is WCAG 2.2 AA, applied to a native iOS app, plus Apple's accessibility guidelines. The riskiest areas are the photo grid, the before-and-after preview and the face picker, because each one leans on visuals.

| Area | Requirement | WCAG 2.2 |
| --- | --- | --- |
| Photo grid | Each photo announces its date, position and suggestion: "Photo 3 of 20, June 12, 2023. Suggested: Erase." | 1.1.1 Non-text Content, 1.3.1 Info and Relationships |
| Mode chips | Name, role and state are announced: "Suggested mode: Erase. Button. Double-tap to change." | 4.1.2 Name, Role, Value |
| Before-and-after preview | A button toggles between versions, so it works without gestures. VoiceOver announces which version is showing | 1.1.1 Non-text Content, 2.5.7 Dragging Movements |
| Face picker | Faces use their People album names, or "Unnamed person 1." "Choose photos myself" is always offered as another way in | 1.1.1 Non-text Content |
| Mode colors | Every mode has a text label, so color is never the only cue | 1.4.1 Use of Color |
| Contrast | Text at least 4.5:1, chip borders and icons at least 3:1, in light and dark mode | 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast |
| Dynamic Type | Copy reflows at the largest text sizes, and button rows stack vertically | 1.4.4 Resize Text, 1.4.10 Reflow |
| Touch targets | At least 44 × 44 pt, per Apple's guidelines, which is above the WCAG minimum | 2.5.8 Target Size (Minimum) |
| Confirmation dialogs | Focus moves into the dialog and returns to the photo that opened it | 2.4.3 Focus Order |
| Status messages | "Restored" and "20 done" are announced without moving focus | 4.1.3 Status Messages |
| Errors | Each error is described in text with a way forward | 3.3.1 Error Identification |
| Motion | Before-and-after transitions follow the iOS Reduce Motion setting | 2.3.3 Animation from Interactions (AAA) |
| Break reminders | The 15-minute check-in never ends a session or times out | 2.2.1 Timing Adjustable |

## Cognitive load

People may use this app during a hard time, when focus and memory are low. One decision per screen, plain words, batches of 20 and a way to pause on every screen all lower the load. These follow W3C guidance on cognitive accessibility, which goes beyond the WCAG success criteria.

## Open question

Alt text for the grid uses dates, because describing what's in each photo would need on-device image captioning. Test whether captions help VoiceOver users decide, or add effort without adding much.
