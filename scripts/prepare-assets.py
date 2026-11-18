"""
prepare-assets: turns assets-src/ into final cut-out WebP images in public/img/.

Run from the project root:
    .venv\\Scripts\\python scripts\\prepare-assets.py [--force]

Steps:
  1. Remove background (rembg, local model) from everything except surface.
  2. Ring ingredients (onion, olive): make the centre hole transparent.
  3. Split ingredient sheets into single pieces (connected components),
     pair raw/baked pieces and crop both with the UNION of their frames,
     so a cross-fade never shifts or resizes a piece.
  4. Pizza raw/baked and box open/closed are cropped with a shared frame.
  5. Export WebP at the sizes from the brief and write a manifest.json.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "img"
CACHE = ROOT / ".cache" / "cutouts"
os.environ.setdefault("U2NET_HOME", str(ROOT / ".cache" / "u2net"))

INGREDIENTS = ["mozzarella", "prosciutto", "salami", "mushroom", "olive", "onion", "basil"]
RING_INGREDIENTS = {"onion", "olive"}

MODEL = "isnet-general-use"
PIECE_MAX = 300
BOWL_MAX = 400
PIZZA_MAX = 1600
BOX_MAX = 1600
TIMER_MAX = 600
TOWEL_MAX = 700
MENU_PIZZAS = ["margerita", "pecka", "vrazja", "gozdna", "kraska"]
MENU_MAX = 1200  # menu pizzas, longest side
SITE_MAX = 2000  # hero / interior / team, longest side (only ever downscaled)
PAD = 6  # px of transparent padding around a piece (source resolution)
MIN_PIECE_AREA = 600  # px, ignore specks


def find_src(stem: str) -> Path:
    for ext in (".png", ".webp", ".jpg", ".jpeg"):
        p = SRC / f"{stem}{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(f"Missing source image: assets-src/{stem}.(png|webp)")


_session = None


def cutout(stem: str, force: bool = False) -> np.ndarray:
    """Background-removed RGBA (uint8) for assets-src/<stem>, cached on disk."""
    CACHE.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE / f"{stem}.png"
    if cache_file.exists() and not force:
        return np.array(Image.open(cache_file).convert("RGBA"))
    global _session
    from rembg import new_session, remove

    if _session is None:
        _session = new_session(MODEL)
    src = Image.open(find_src(stem)).convert("RGB")
    res = remove(src, session=_session, post_process_mask=True)
    res = res.convert("RGBA")
    res.save(cache_file)
    return np.array(res)


def clean_alpha(rgba: np.ndarray) -> np.ndarray:
    """Tighten the matte: kill faint halo, 1px erosion, soften the edge."""
    a = rgba[..., 3].astype(np.float32) / 255.0
    a = np.clip((a - 0.12) / 0.76, 0, 1)
    a = ndi.grey_erosion(a, size=(3, 3))
    a = ndi.gaussian_filter(a, 0.6)
    out = rgba.copy()
    out[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    return out


def restore_silhouette(rgba: np.ndarray, src_rgb: np.ndarray, hull: bool = False) -> np.ndarray:
    """Subjects with white/pale areas (parchment in the box, white towel
    stripes) get those areas cut by the matte. Fill the silhouette back in and
    take the pixels from the original photo."""
    mask = rgba[..., 3] > 128
    if hull:
        from skimage.morphology import convex_hull_image

        filled = convex_hull_image(mask)
    else:
        filled = ndi.binary_fill_holes(ndi.binary_closing(mask, iterations=3))
    out = rgba.copy()
    add = filled & ~mask
    out[..., :3][add] = src_rgb[add]
    out[..., 3] = np.where(filled, 255, out[..., 3])
    return out


def punch_ring_holes(rgba: np.ndarray, src_rgb: np.ndarray, neutral: bool = False) -> np.ndarray:
    """Make the hole of every ring transparent.

    rembg usually keeps the hole opaque. For each piece we grow a region from
    its centroid over pixels that look like the studio background (taken from
    the original photo) and clear it.

    neutral=True (onion): the studio background is a neutral grey, the onion is
    pink/purple, so we select by low colourfulness. That also removes the soft
    shadow inside the hole without eating the pale inner onion layer.
    """
    out = rgba.copy()
    alpha = out[..., 3] > 128
    filled = ndi.binary_fill_holes(alpha)
    labels, n = ndi.label(filled)
    bg = np.median(
        np.concatenate([src_rgb[:12, :, :].reshape(-1, 3), src_rgb[-12:, :, :].reshape(-1, 3)]), axis=0
    )
    rgb = src_rgb.astype(np.float32)
    for i in range(1, n + 1):
        comp = labels == i
        if comp.sum() < MIN_PIECE_AREA:
            continue
        cy, cx = ndi.center_of_mass(comp)
        cy, cx = int(round(cy)), int(round(cx))
        ys, xs = np.where(comp)
        # local background colour: median of the photo colour in the hole centre
        patch = rgb[max(cy - 3, 0): cy + 4, max(cx - 3, 0): cx + 4].reshape(-1, 3)
        seed = np.median(patch, axis=0)
        # if centroid is not "background-like" the piece is not a ring (skip)
        if np.abs(seed - bg).max() > 45:
            continue
        if neutral:
            near = (rgb.max(axis=2) - rgb.min(axis=2)) < 13
        else:
            near = np.abs(rgb - seed).max(axis=2) < 38
        cand = near & comp
        cl, _ = ndi.label(cand)
        seed_label = cl[cy, cx]
        if seed_label == 0:
            continue
        hole = cl == seed_label
        if neutral:
            # smooth ragged hole border (the hole is a clean ellipse)
            hole = ndi.binary_opening(hole, iterations=3)
            hole = ndi.binary_closing(hole, iterations=3)
        hole = ndi.binary_dilation(hole, iterations=1)  # eat the bright fringe
        out[..., 3][hole] = 0
    return out


def components(rgba: np.ndarray):
    """Connected pieces of an ingredient sheet, in reading order."""
    mask = rgba[..., 3] > 24
    mask = ndi.binary_closing(mask, iterations=2)
    labels, n = ndi.label(mask)
    comps = []
    for i in range(1, n + 1):
        m = labels == i
        area = int(m.sum())
        if area < MIN_PIECE_AREA:
            continue
        ys, xs = np.where(m)
        comps.append(
            dict(
                mask=m,
                bbox=(int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
                cx=float(xs.mean()),
                cy=float(ys.mean()),
                area=area,
            )
        )
    # reading order: bucket by row (rows are ~120px apart) then by x
    comps.sort(key=lambda c: (round(c["cy"] / 90), c["cx"]))
    return comps


def union_box(a, b):
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def pad_box(box, size, pad):
    w, h = size
    return (max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, w), min(box[3] + pad, h))


def to_image(rgba: np.ndarray, box, keep_mask: np.ndarray | None = None, max_side: int | None = None, scale: float | None = None) -> Image.Image:
    x0, y0, x1, y1 = box
    crop = rgba[y0:y1, x0:x1].copy()
    if keep_mask is not None:
        km = keep_mask[y0:y1, x0:x1]
        km = ndi.binary_dilation(km, iterations=3)
        crop[..., 3] = np.where(km, crop[..., 3], 0)
    im = Image.fromarray(crop, "RGBA")
    if scale is None and max_side is not None:
        scale = min(1.0, max_side / max(im.size))
    if scale and scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    return im


def save_webp(im: Image.Image, name: str, quality: int = 90) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / name
    im.save(p, "WEBP", quality=quality, alpha_quality=100, method=6)
    return p


def alpha_bbox(rgba: np.ndarray, thr: int = 24):
    ys, xs = np.where(rgba[..., 3] > thr)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def main() -> int:
    force = "--force" in sys.argv
    created: list[Path] = []
    manifest: dict = {"pieces": {}, "images": {}}

    # ---- ingredient pieces -------------------------------------------------
    for ing in INGREDIENTS:
        raw = cutout(f"{ing}-raw", force)
        baked = cutout(f"{ing}-baked", force)
        if ing in RING_INGREDIENTS:
            neutral = ing == "onion"
            raw = punch_ring_holes(raw, np.array(Image.open(find_src(f"{ing}-raw")).convert("RGB")), neutral)
            baked = punch_ring_holes(baked, np.array(Image.open(find_src(f"{ing}-baked")).convert("RGB")), neutral)
        raw = clean_alpha(raw)
        baked = clean_alpha(baked)

        cr, cb = components(raw), components(baked)
        if len(cr) != len(cb):
            print(f"!! {ing}: raw has {len(cr)} pieces, baked {len(cb)}", file=sys.stderr)
        h, w = raw.shape[:2]
        used = set()
        n = 0
        pieces = []
        for rc in cr:
            # match the baked piece on the same spot (largest mask overlap)
            best, best_ov = None, 0
            for j, bc in enumerate(cb):
                if j in used:
                    continue
                ov = int((rc["mask"] & bc["mask"]).sum())
                if ov > best_ov:
                    best, best_ov = j, ov
            if best is None:
                print(f"!! {ing}: no baked pair for raw piece at {rc['bbox']}", file=sys.stderr)
                continue
            used.add(best)
            bc = cb[best]
            box = pad_box(union_box(rc["bbox"], bc["bbox"]), (w, h), PAD)
            scale = min(1.0, PIECE_MAX / max(box[2] - box[0], box[3] - box[1]))
            n += 1
            im_r = to_image(raw, box, keep_mask=rc["mask"], scale=scale)
            im_b = to_image(baked, box, keep_mask=bc["mask"], scale=scale)
            created.append(save_webp(im_r, f"{ing}-{n}-raw.webp"))
            created.append(save_webp(im_b, f"{ing}-{n}-baked.webp"))
            pieces.append({"n": n, "w": im_r.width, "h": im_r.height})
        manifest["pieces"][ing] = pieces
        print(f"{ing}: {n} pieces (raw {len(cr)}, baked {len(cb)})")

    # ---- pizza (shared frame) ---------------------------------------------
    pr = clean_alpha(cutout("pizza-raw", force))
    pb = clean_alpha(cutout("pizza-baked", force))
    box = union_box(alpha_bbox(pr), alpha_bbox(pb))
    scale = min(1.0, PIZZA_MAX / max(box[2] - box[0], box[3] - box[1]))
    for name, arr in (("pizza-raw", pr), ("pizza-baked", pb)):
        im = to_image(arr, box, scale=scale)
        created.append(save_webp(im, f"{name}.webp", 92))
        manifest["images"][name] = {"w": im.width, "h": im.height}

    # ---- box (shared frame, so the lid lands exactly on the open box) --------
    src_open = np.array(Image.open(find_src("box-open")).convert("RGB"))
    bo = clean_alpha(restore_silhouette(cutout("box-open", force), src_open))
    bc_ = clean_alpha(cutout("box-closed", force))
    box = union_box(alpha_bbox(bo), alpha_bbox(bc_))
    scale = min(1.0, BOX_MAX / max(box[2] - box[0], box[3] - box[1]))
    for name, arr in (("box-open", bo), ("box-closed", bc_)):
        im = to_image(arr, box, scale=scale)
        created.append(save_webp(im, f"{name}.webp", 92))
        manifest["images"][name] = {"w": im.width, "h": im.height}

    # ---- bowls --------------------------------------------------------------
    for ing in INGREDIENTS:
        arr = clean_alpha(cutout(f"bowl-{ing}", force))
        im = to_image(arr, pad_box(alpha_bbox(arr), arr.shape[1::-1], 4), max_side=BOWL_MAX)
        created.append(save_webp(im, f"bowl-{ing}.webp"))
        manifest["images"][f"bowl-{ing}"] = {"w": im.width, "h": im.height}

    # ---- timer, towel -------------------------------------------------------
    for stem, mx in (("timer", TIMER_MAX), ("towel", TOWEL_MAX)):
        arr = cutout(stem, force)
        if stem == "towel":  # folded cloth: silhouette is convex, white stripes got cut
            arr = restore_silhouette(arr, np.array(Image.open(find_src(stem)).convert("RGB")), hull=True)
        arr = clean_alpha(arr)
        im = to_image(arr, pad_box(alpha_bbox(arr), arr.shape[1::-1], 4), max_side=mx)
        created.append(save_webp(im, f"{stem}.webp"))
        manifest["images"][stem] = {"w": im.width, "h": im.height}

    # ---- surface (background stays) -----------------------------------------
    im = Image.open(find_src("surface")).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / "surface.webp"
    im.save(p, "WEBP", quality=88, method=6)
    created.append(p)
    manifest["images"]["surface"] = {"w": im.width, "h": im.height}

    # ---- landing page: menu pizzas share one frame ---------------------------
    manifest["site"] = {}
    cuts = {m: clean_alpha(cutout(f"menu-{m}", force)) for m in MENU_PIZZAS}
    box = None
    for a in cuts.values():
        b = alpha_bbox(a)
        box = b if box is None else union_box(box, b)
    h0, w0 = next(iter(cuts.values())).shape[:2]
    box = pad_box(box, (w0, h0), 4)
    scale = min(1.0, MENU_MAX / max(box[2] - box[0], box[3] - box[1]))
    for m, a in cuts.items():
        im = to_image(a, box, scale=scale)
        created.append(save_webp(im, f"menu-{m}.webp", 92))
        manifest["site"][f"menu-{m}"] = {"w": im.width, "h": im.height}

    # ---- landing page: photos, only downscaled (never upscaled) --------------
    for stem in ("hero", "interior", "team"):
        im = Image.open(find_src(stem)).convert("RGB")
        long_side = max(im.size)
        if long_side > SITE_MAX:
            k = SITE_MAX / long_side
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        p = OUT / f"{stem}.webp"
        im.save(p, "WEBP", quality=84, method=6)
        created.append(p)
        manifest["site"][stem] = {"w": im.width, "h": im.height}

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("\nCreated files:")
    for p in sorted(created):
        print(f"  {p.name}  {p.stat().st_size // 1024} KB")
    print("\nPieces per ingredient:")
    for ing, ps in manifest["pieces"].items():
        print(f"  {ing}: {len(ps)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
