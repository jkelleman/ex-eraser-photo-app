# Roadmap specs: erase and soft silhouette

This roadmap covers how to make the two hardest edits, erase and soft silhouette, look better and stay honest. Each item says what's wrong today, what to build, and how to know it's done.

**Status:** planned. The current pipeline is in [`tools/erase_person.py`](../tools/erase_person.py), and its results are on the [proof page](../demo/README.md).

## Where things stand

Erase works well on the six test edits. It runs LaMa on a crop around the person at the size the model was trained on, so walls, pavement and pillars carry through the gap. A few problems still show:

| Problem | Where it shows |
| --- | --- |
| A bit of his hand is left where they were holding hands | Afternoon walk |
| A faint trace of the groom shows through the bride's veil | Wedding day |
| The outline missed his hat and a shoe, so each needed a manual touch-up | Afternoon walk, Wedding day |
| A wide outline cut into her cheek, so it had to be tightened by hand | Quiet moment (close-up) |
| Large rebuilt areas are a little softer than the rest of the photo | Wedding day, Quiet moment |
| The silhouette is a blur of the real person, so hair color, glasses and clothing still show faintly | Quiet moment, soft silhouette |

## Guiding rules

These apply to every item below.

- **Nothing new should appear in the photo.** An invented object is worse than a soft patch. When in doubt, the tool chooses the plainer result.
- **The people who stay are never changed.** Their faces, hair and edges stay exactly as they were.
- **Every AI edit is labeled,** in the photo's metadata and in plain words in the app.
- **The user always has another option.** If erase won't look good, the app says so and suggests one that will.

## Phase 1: fix what shows today

### 1. Protect the people who stay

**Problem.** The area being erased can spread onto the person who stays. In the close-up, it cut into her cheek until the outline was tightened by hand.

**Build.**
- Find every person in the photo, as the tool already does.
- Build a "protected" area from everyone except the person being removed, widened by a few pixels.
- Remove the protected area from the erase area before filling, and paste the original pixels back over it after filling.
- Apply the same protection to the soft silhouette.

**Done when.**
- No pixel inside a kept person's outline changes in any of the six test edits.
- The close-up works with the default outline width, with no hand tuning.

**Size:** small.

### 2. Sharper outlines

**Problem.** The tool uses the smallest version of YOLOv8 to outline people. Its edges are rough around hair, hands and fingers, which leaves bits behind, like his hand in the walking photo.

**Build.**
- Keep YOLO to find people and draw a box around each one.
- Pass each box to [SAM 2](https://github.com/facebookresearch/sam2) (Segment Anything 2, Apache 2.0) to trace a precise outline.
- Where two people overlap, such as joined hands or a shared veil, split the overlap by which person each part connects to.
- For the App Store version, use Apple's Vision framework (person instance masks, iOS 17 and later). It runs on the phone and avoids the AGPL license that comes with Ultralytics YOLO.

**Done when.**
- No visible leftover hand in the walking photo.
- The groom's trace through the veil is gone, or faint enough that a reviewer can't point to it.
- Outlines follow hair closely enough that no halo shows after erasing.

**Size:** medium. SAM 2 weights are about 150 MB for the small model.

### 3. Catch belongings and shadows automatically

**Problem.** Things people hold or wear, like a hat, a bag or shoes, can fall outside the outline. Today they need a manual touch-up.

**Build.**
- Run the same detector for common carried objects: handbag, backpack, umbrella, hat, suitcase and phone.
- Add an object to the erase area when it touches the person's outline or sits within a few pixels of their hands.
- Find an attached shadow: a darker patch on the ground that touches the person's feet and runs in the direction of the scene's light. Add it to the erase area.
- Keep the manual touch-up ("Missed a spot? Brush over it") as a backup.

**Done when.**
- The hat in the walking photo and the shoe in the wedding photo are erased with no manual touch-up.
- Objects that belong to the people who stay are never added.

**Size:** medium.

### 4. Make several fills and keep the best one

**Problem.** One fill is a single guess. Some guesses are better than others, and today nothing checks.

**Build.**
- Make three fills with slightly different crop sizes (1.4, 1.6 and 1.9 times the person) and outline widths.
- Check each fill automatically:
  - **Person check:** run the person finder again. Any person found inside the rebuilt area means the fill failed.
  - **New object check:** run the object detector on the original and the result. Any object in the rebuilt area that wasn't in the original means the fill failed.
  - **Seam check:** measure how sharply color and texture change along the edge of the rebuilt area. Lower is better.
- Keep the passing fill with the best seam score. If all three fail, don't save the erase. Suggest crop or silhouette instead.
- Record which checks ran, and their results, in the edit record.

**Done when.**
- The tool never saves a fill that fails the person or new object check.
- On the six test edits, the chosen fill scores the same as or better than today's on the scoring guide (see "How we'll know it's better").

**Size:** medium. Each erase takes about three times as long, still under a minute on a laptop.

### 5. Background-based soft silhouette

**Problem.** The silhouette is a blur of the actual person, so identifying details still show faintly.

**Build.**
- Erase the person first, using the same steps as erase.
- Draw a soft, translucent shape of their outline on top of the rebuilt background. No pixels from the real person are used.
- Tint the shape with the scene's own colors so it looks like part of the photo.
- Keep it behind the people who stay (item 1).

**Done when.**
- No hair color, glasses or clothing details can be seen in the silhouette.
- Reviewers say the shape reads as "someone was here" and can't say who.

**Size:** small, once items 1 and 4 are in place.

## Phase 2: give people more control

### 6. Silhouette strength

A slider from "a faint trace" to "a clear shape". The user decides how much of the moment to keep.

**Done when:** the slider covers the full range, the default is the middle, and the edit record saves the chosen strength.

### 7. Silhouette styles

Three styles to start:

| Style | What it looks like |
| --- | --- |
| Frosted glass | A soft, milky shape, like the person stood behind a frosted window |
| Soft light | A gentle glow in their shape, as if light were coming through |
| Outline | A thin, soft line where they stood, like a pencil sketch |

**Done when:** each style works on all test photos and passes the accessibility check for contrast against the photo.

### 8. Crop, then erase

When the ex is near the edge but crop alone would cut too much, crop part of them away first and erase only the rest. That shrinks the area to rebuild, often from about 40% of the photo to about 15%.

**Done when:** the triage step suggests "crop and erase" when it would cut the area to rebuild by at least half.

### 9. Soften the background in close-ups

In close-ups, add a light portrait-mode blur across the whole background. The rebuilt area blends in, and the photo still looks natural.

**Done when:** offered as an option for close-ups, and reviewers can't spot the rebuilt area at normal viewing size.

## Phase 3: better raw material

### 10. Use real pixels from nearby photos

Live Photos, bursts and photos taken seconds apart often show the same background after the ex moved. Fill from a real photo first. Use the AI fill only for what's still missing.

**Done when:** for photos with a nearby match, the app lines up the second photo, fills from it and labels the edit as "combined from your photos".

**Size:** large. It needs photo alignment and access to the photo library on the phone.

### 11. Sharpen large fills

On big gaps, the rebuilt area is softer than the rest of the photo. Add a second pass with an upscaling model, such as [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (BSD 3-Clause), only on the rebuilt area.

**Done when:** the seam check (item 4) improves on the wedding and close-up photos, with no new objects.

### 12. Test a diffusion model, carefully

Diffusion inpainting, such as Stable Diffusion or Apple's on-device image tools, can draw finer detail. It's also slower and more likely to invent things.

**Done when:** it has been run through the same checks and scoring guide as LaMa. Adopt it only if it scores better and passes the new object check every time.

## How the app decides: erase or something else

These rules come from the triage discussion and should be built alongside the items above.

### Show how much was redrawn

Measure the share of the photo the AI rebuilt, and show it in plain words.

| Share redrawn | Label in the app |
| --- | --- |
| Under 15% | "A small part of this photo was redrawn by AI." |
| 15% to 30% | "About a fifth of this photo was redrawn by AI." |
| 30% to 45% | "About a third of this photo was redrawn by AI." |
| Over 45% | "Much of this photo was redrawn by AI." |

Save the exact number in the edit record and the photo's metadata.

### Suggest the right mode

The share redrawn is one signal. These matter just as much:

- **Touching someone:** overlap with a person who stays (hands, hair, a veil) is where leftovers appear.
- **Photo size:** small or old photos give softer fills, so the limits below should be lower for them.
- **Distance to the edge:** this decides whether crop is possible at all.

| Situation | Suggestion |
| --- | --- |
| Under 25% redrawn, touching no one | Erase |
| 25% to 45% redrawn, or touching someone | Erase, then open the before and after so they can judge |
| Over 45% redrawn, at the edge, touching no one | Crop |
| Over 45% redrawn and touching someone | Soft silhouette |
| Most of the photo is them | Delete, with the usual final review |
| Their children are in it | Fade |
| Any case | "Keep it for later" is always offered |

### Ask after each erase

A quick question after each erase: "Does this look right?" with **Yes**, **Touch up** and **Try another way**. The answers show where the limits should sit.

## How we'll know it's better

### A harder test set

Add 10 to 15 openly licensed photos to the current four, covering:

- Hugs and people leaning on each other
- Couples with children
- Group shots of five or more
- Low light and night photos
- Old scanned prints
- Busy backgrounds, like crowds, foliage and patterned walls
- A range of ages, ethnicities and abilities, as in the current set

### A scoring guide

Score each edit from 1 to 5 on each of these:

| What to check | 5 means |
| --- | --- |
| Leftovers | No part of the removed person is visible |
| Invented objects | Nothing appears that wasn't in the original |
| Seams | The rebuilt area can't be found at normal viewing size |
| People who stay | Nobody who stays is changed in any way |
| Feels natural | The photo looks like a real moment |

Silhouettes also get scored on **Can't be recognized** (5 means no one could say who it was).

### Who scores

Every version gets scored by a small group of people and by an LLM judge given the same guide. Agreement between the two shows the judge can be trusted for larger runs. Track the scores for each version in a table, so the case study can show progress with real numbers.

## Order of work

| Step | Item | Depends on |
| --- | --- | --- |
| 1 | Test set and scoring guide | Nothing. Do this first so every change can be measured |
| 2 | Protect the people who stay | Nothing |
| 3 | Sharper outlines | Nothing |
| 4 | Background-based silhouette | 2 |
| 5 | Make several fills and keep the best | 2, 3 |
| 6 | Catch belongings and shadows | 3 |
| 7 | Redrawn share label and mode suggestions | 5 |
| 8 | Silhouette strength and styles | 4 |
| 9 | Crop then erase, soften background | 7 |
| 10 | Sharpen large fills | 5 |
| 11 | Real pixels from nearby photos | App version only |
| 12 | Diffusion test | 1, 5 |
