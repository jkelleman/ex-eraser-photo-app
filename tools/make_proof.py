"""Builds the proof images in demo/proof from demo/originals and demo/results.

Each image shows three panels: the original, the outline the AI found, and the result.

  python tools/make_proof.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS, RESULTS, PROOF = ROOT / "demo/originals", ROOT / "demo/results", ROOT / "demo/proof"
FONT = ImageFont.truetype(str(ROOT / "prototype/public/fonts/figtree-latin-400-normal.woff2"), 26)
HEIGHT, LABEL, GAP = 520, 44, 20

LABELS = {"erase": "Erase", "crop": "Crop", "silhouette": "Soft silhouette"}


def panel_row(panels: list[tuple[str, Image.Image]]) -> Image.Image:
    scaled = [(label, im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)) for label, im in panels]
    width = sum(im.width for _, im in scaled) + GAP * (len(scaled) - 1)
    sheet = Image.new("RGB", (width, HEIGHT + LABEL), "white")
    draw = ImageDraw.Draw(sheet)
    x = 0
    for label, im in scaled:
        sheet.paste(im, (x, LABEL))
        draw.text((x + 4, 8), label, font=FONT, fill=(28, 24, 36))
        x += im.width + GAP
    return sheet


def main() -> None:
    PROOF.mkdir(exist_ok=True)
    for result in sorted(RESULTS.glob("*.jpg")):
        name, _, mode = result.stem.rpartition("-")
        if mode not in LABELS:
            continue
        sheet = panel_row([
            ("Original", Image.open(ORIGINALS / f"{name}.jpg").convert("RGB")),
            ("Person found by the AI", Image.open(RESULTS / f"{name}-mask.jpg").convert("RGB")),
            (f"Result: {LABELS[mode]}", Image.open(result).convert("RGB")),
        ])
        sheet.save(PROOF / result.name, quality=86)
        print("Saved", PROOF / result.name)


if __name__ == "__main__":
    main()
