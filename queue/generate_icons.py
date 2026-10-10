from PIL import Image, ImageDraw

BG = (217, 119, 6)  # amber accent, distinct from Music Journal's blue
FG = (241, 242, 245)  # text


def draw_queue(draw, size, scale=1.0):
    cx, cy = size / 2, size / 2
    bar_h = size * 0.10 * scale
    gap = size * 0.14 * scale
    widths = [0.52, 0.40, 0.28]  # decreasing bar widths = a queue/playlist
    total_h = bar_h * 3 + gap * 2
    top = cy - total_h / 2
    for i, w in enumerate(widths):
        bar_w = size * w
        y0 = top + i * (bar_h + gap)
        y1 = y0 + bar_h
        x0 = cx - bar_w / 2
        x1 = cx + bar_w / 2
        draw.rounded_rectangle([x0, y0, x1, y1], radius=bar_h / 2, fill=FG)


def make_icon(path, size, radius_ratio=0.22, content_scale=1.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [0, 0, size, size],
        radius=int(size * radius_ratio),
        fill=BG,
    )
    draw_queue(draw, size, scale=content_scale)
    img.save(path)


make_icon("public/icons/icon-192.png", 192)
make_icon("public/icons/icon-512.png", 512)
# Maskable: background fills the full square (no rounded corners — the OS
# applies its own mask), content shrunk to stay inside the safe zone.
make_icon("public/icons/icon-maskable-512.png", 512, radius_ratio=0, content_scale=0.7)
make_icon("public/icons/apple-touch-icon.png", 180)

print("done")
