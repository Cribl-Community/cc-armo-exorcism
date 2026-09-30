"""Turn portraits into consistent tarot-card faces for public/assets/characters/.

Usage: python tools/tarotize.py <folder with 1.webp 2.webp 3.png 4.png> public/assets/characters

Each image is fitted to the card-face aspect (560x640) with headroom above the head for the costume
layer (src/ritual/characters/Costume.tsx), graded with a duotone in its card hue (blended so faces
stay recognizable), lightly posterized and vignetted. Requires Pillow with WebP support.
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

W, H = 560, 640          # card-face aspect 0.875
HEADROOM = 0.12          # fraction of height reserved above the photo for crowns and halos

# name: (file, crop box in source px (left, top, right, bottom), shadow hue, highlight hue)
PEOPLE = {
    'arno':      ('1.webp', (0, 0, 800, 800),  (6, 38, 46),  (255, 236, 200)),
    'moise':     ('2.webp', (0, 0, 800, 800),  (30, 12, 58), (250, 232, 214)),
    'ceo':       ('3.png',  (0, 0, 600, 600),  (46, 26, 4),  (255, 238, 196)),
    'priestess': ('4.png',  (0, 0, 457, 457),  (8, 40, 48),  (255, 246, 232)),
}

BLEND = 0.5  # how much duotone over the original


def tarotize(name, file, box, dark, light):
    img = Image.open(SRC / file).convert('RGB').crop(box)
    photo_h = int(H * (1 - HEADROOM))
    # Sources are square; keep their aspect (W x photo_h is ~square) so faces are not distorted.
    photo = img.resize((W, photo_h), Image.LANCZOS)

    # Headroom: the photo sits low; above it the card's shadow hue fades down into the image.
    canvas = Image.new('RGB', (W, H), dark)
    canvas.paste(photo, (0, H - photo_h))
    fade_h = int(H * 0.22)
    fade = Image.linear_gradient('L').resize((W, fade_h))            # 0 at top -> 255 at bottom
    top = Image.new('RGB', (W, fade_h), dark)
    region = canvas.crop((0, H - photo_h, W, H - photo_h + fade_h))
    canvas.paste(Image.composite(region, top, fade), (0, H - photo_h))

    # A painterly pass so it reads as a printed card rather than a photo.
    canvas = canvas.filter(ImageFilter.ModeFilter(3)).filter(ImageFilter.EDGE_ENHANCE)

    # Duotone grade in the card's hue, blended with the original.
    gray = ImageOps.autocontrast(ImageOps.grayscale(canvas), cutoff=1)
    duo = ImageOps.colorize(gray, black=dark, white=light, mid=None)
    graded = Image.blend(canvas, duo, BLEND)
    graded = ImageEnhance.Contrast(graded).enhance(1.12)
    graded = ImageEnhance.Color(graded).enhance(1.08)

    # A touch of posterize for a printed-card feel, mixed back in gently.
    poster = ImageOps.posterize(graded, 5)
    graded = Image.blend(graded, poster, 0.35)

    # Vignette.
    vig = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(vig)
    d.ellipse((-W * 0.15, -H * 0.05, W * 1.15, H * 1.1), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(60))
    shade = Image.new('RGB', (W, H), dark)
    graded = Image.composite(graded, shade, vig)

    graded = graded.crop((2, 2, W - 2, H - 2)).resize((W, H), Image.LANCZOS)  # trim filter edge artifacts
    out = OUT / f'{name}.webp'
    graded.save(out, 'WEBP', quality=84, method=6)
    print(name, out.stat().st_size, 'bytes')


for name, (file, box, dark, light) in PEOPLE.items():
    tarotize(name, file, box, dark, light)
