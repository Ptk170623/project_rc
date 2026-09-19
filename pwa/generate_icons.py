from PIL import Image, ImageDraw

BG = (92, 124, 250)  # accent-strong
FG = (241, 242, 245)  # text


def draw_headphones(draw, size, scale=1.0):
    cx, cy = size / 2, size / 2 * 1.02
    r = size * 0.30 * scale
    stroke = max(int(size * 0.09 * scale), 2)

    # headband arc
    bbox = [cx - r, cy - r * 1.15, cx + r, cy + r * 1.15]
    draw.arc(bbox, start=180, end=360, fill=FG, width=stroke)

    # ear cups
    cup_w, cup_h = size * 0.16 * scale, size * 0.22 * scale
    left_cx = cx - r
    right_cx = cx + r
    cup_y = cy
    for ccx in (left_cx, right_cx):
        draw.rounded_rectangle(
            [ccx - cup_w / 2, cup_y - cup_h / 2, ccx + cup_w / 2, cup_y + cup_h / 2],
            radius=cup_w * 0.4,
            fill=FG,
        )


def make_icon(path, size, radius_ratio=0.22, content_scale=1.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [0, 0, size, size],
        radius=int(size * radius_ratio),
        fill=BG,
    )
    draw_headphones(draw, size, scale=content_scale)
    img.save(path)


make_icon("public/icons/icon-192.png", 192)
make_icon("public/icons/icon-512.png", 512)
# Maskable: background fills the full square (no rounded corners — the OS
# applies its own mask), content shrunk to stay inside the safe zone.
make_icon("public/icons/icon-maskable-512.png", 512, radius_ratio=0, content_scale=0.7)
make_icon("public/icons/apple-touch-icon.png", 180)

print("done")
