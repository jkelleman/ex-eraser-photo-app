"""Proof of concept: remove one person from a photo.

Pipeline
  1. Find people: YOLOv8 instance segmentation outlines every person.
  2. Pick the person: by position (left to right) for this demo. In the app,
     the person is chosen by face in onboarding.
  3. Edit:
       erase       LaMa fills the person's outline with background
       silhouette  erase, then draw a soft outline where they stood
       crop        crop the frame so the person is outside it
  4. Label: the edited JPEG carries IPTC Digital Source Type
     "compositeWithTrainedAlgorithmicMedia" (edited with generative AI) in
     its XMP metadata, and a JSON edit record is written beside it.

Usage
  python tools/erase_person.py photo.jpg --person 2 --mode erase --out out/
  python tools/erase_person.py photo.jpg --list      # show the people found
  python tools/erase_person.py photo.jpg --person 2 --touch-up 1090 600 1240 800
                                                     # also erase a missed spot

Models download on first run: yolov8n-seg (Ultralytics, AGPL-3.0) and
big-lama (LaMa, Apache-2.0). Everything runs on this machine.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

DIGITAL_SOURCE_TYPE = "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia"
HUMAN_EDITS = "http://cv.iptc.org/newscodes/digitalsourcetype/humanEdits"


def find_people(image: Image.Image, min_conf: float = 0.4):
    """Returns people sorted left to right, each with a mask, box and score."""
    from ultralytics import YOLO

    model = YOLO("yolov8n-seg.pt")
    result = model.predict(np.array(image), classes=[0], conf=min_conf, retina_masks=True, verbose=False)[0]
    people = []
    if result.masks is None:
        return people
    for mask, box, conf in zip(result.masks.data.cpu().numpy(), result.boxes.xyxy.cpu().numpy(), result.boxes.conf.cpu().numpy()):
        mask = cv2.resize((mask > 0.5).astype(np.uint8), image.size, interpolation=cv2.INTER_NEAREST)
        people.append({"mask": mask, "box": [int(v) for v in box], "score": float(conf)})
    people.sort(key=lambda p: (p["box"][0] + p["box"][2]) / 2)
    return people


def grow(mask: np.ndarray, pixels: int) -> np.ndarray:
    """Widens the outline so edges, hair and shadows are covered too."""
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (pixels * 2 + 1, pixels * 2 + 1))
    return cv2.dilate(mask, kernel)


def hull(mask: np.ndarray) -> np.ndarray:
    """Fills the outline's convex hull, which catches things the person holds (a hat, a bag)."""
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return mask
    out = np.zeros_like(mask)
    cv2.fillPoly(out, [cv2.convexHull(np.vstack(contours))], 1)
    return out


def erase(image: Image.Image, mask: np.ndarray) -> Image.Image:
    from simple_lama_inpainting import SimpleLama

    lama = SimpleLama()
    result = lama(image, Image.fromarray(mask * 255))
    return result.resize(image.size)


def silhouette(image: Image.Image, mask: np.ndarray, grow_px: int = 18) -> Image.Image:
    """Frosted-glass silhouette: the person becomes a soft, unrecognizable shape.

    Close-ups are hard to erase without a blur where the person was, so the app
    suggests this instead. The shape of the moment stays; the face does not.
    """
    src = np.array(image).astype(np.float32)
    shape = grow(mask, max(grow_px // 2, 4)).astype(np.float32)
    frosted = cv2.GaussianBlur(src, (0, 0), 28)
    frosted = frosted * 0.78 + 255.0 * 0.22
    alpha = cv2.GaussianBlur(shape, (0, 0), 10)[..., None]
    out = src * (1 - alpha) + frosted * alpha
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def crop_out(image: Image.Image, target: dict, others: list[dict]) -> Image.Image:
    """Largest 3:2 or 2:3 crop that keeps everyone else and leaves the target out."""
    w, h = image.size
    tx0, _, tx1, _ = target["box"]
    keep_x0 = min([o["box"][0] for o in others], default=0)
    keep_x1 = max([o["box"][2] for o in others], default=w)
    if tx0 >= keep_x1:  # target on the right
        x0, x1 = 0, tx0
    elif tx1 <= keep_x0:  # target on the left
        x0, x1 = tx1, w
    else:
        raise ValueError("The person overlaps the others, so a crop can't leave them out. Try erase instead.")
    return image.crop((x0, 0, x1, h))


def xmp_packet(source_type: str, note: str) -> bytes:
    return f"""<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    Iptc4xmpExt:DigitalSourceType="{source_type}"
    photoshop:Credit="Edited with Ex-Eraser Photo App"
    photoshop:Instructions="{note}"/>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>""".encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("photo", type=Path)
    parser.add_argument("--person", type=int, default=1, help="Person to remove, counted from the left (1 = leftmost)")
    parser.add_argument("--mode", choices=["erase", "silhouette", "crop"], default="erase")
    parser.add_argument("--grow", type=int, default=18, help="Pixels to widen the outline before erasing")
    parser.add_argument("--touch-up", type=int, nargs=4, action="append", metavar=("X0", "Y0", "X1", "Y1"),
                        help="Also erase this box, like brushing over a spot the outline missed (repeatable)")
    parser.add_argument("--hull", action="store_true", help="Also erase what the person holds, by filling the outline's convex hull")
    parser.add_argument("--out", type=Path, default=Path("out"))
    parser.add_argument("--list", action="store_true", help="List the people found and stop")
    args = parser.parse_args()

    image = Image.open(args.photo).convert("RGB")
    people = find_people(image)
    if args.list or not people:
        print(f"Found {len(people)} people in {args.photo.name}")
        for i, p in enumerate(people, 1):
            print(f"  {i}: box {p['box']}, confidence {p['score']:.2f}")
        return
    if not 1 <= args.person <= len(people):
        raise SystemExit(f"Choose a person from 1 to {len(people)}.")

    target = people[args.person - 1]
    if args.hull:
        target["mask"] = hull(target["mask"])
    for x0, y0, x1, y1 in args.touch_up or []:
        cv2.ellipse(target["mask"], ((x0 + x1) // 2, (y0 + y1) // 2), ((x1 - x0) // 2, (y1 - y0) // 2), 0, 0, 360, 1, -1)
    others = [p for i, p in enumerate(people) if i != args.person - 1]

    if args.mode == "erase":
        result = erase(image, grow(target["mask"], args.grow))
        source_type = DIGITAL_SOURCE_TYPE
    elif args.mode == "silhouette":
        result = silhouette(image, target["mask"], args.grow)
        source_type = DIGITAL_SOURCE_TYPE
    else:
        result = crop_out(image, target, others)
        source_type = HUMAN_EDITS

    args.out.mkdir(parents=True, exist_ok=True)
    stem = f"{args.photo.stem}-{args.mode}"
    note = f"{args.mode} applied to person {args.person} of {len(people)}"
    result.save(args.out / f"{stem}.jpg", quality=90, xmp=xmp_packet(source_type, note))

    overlay = np.array(image).copy()
    overlay[target["mask"] > 0] = (0.45 * overlay[target["mask"] > 0] + 0.55 * np.array([90, 62, 138])).astype(np.uint8)
    Image.fromarray(overlay).save(args.out / f"{args.photo.stem}-mask.jpg", quality=85)

    record = {
        "source": args.photo.name,
        "mode": args.mode,
        "person": args.person,
        "people_found": len(people),
        "digital_source_type": source_type,
        "edited_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "touch_ups": args.touch_up or [],
        "models": ["yolov8n-seg (Ultralytics)", "big-lama (LaMa)"] if args.mode != "crop" else ["yolov8n-seg (Ultralytics)"],
    }
    (args.out / f"{stem}.json").write_text(json.dumps(record, indent=2))
    print(f"Saved {stem}.jpg, the mask preview and the edit record in {args.out}")


if __name__ == "__main__":
    main()
