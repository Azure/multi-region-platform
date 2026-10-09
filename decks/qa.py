#!/usr/bin/env python3
"""Check a built deck and render it for review.

    python3 decks/qa.py full                 # structure and type checks on out/…-Full.pptx
    python3 decks/qa.py exec --render        # also render every slide to out/preview/exec/slide-NN.jpg + contact sheets
    python3 decks/qa.py full --render 12 13  # render only these slides (the whole deck is converted once)

Fails (exit 1) when a slide has no title, a picture has no alt text or a file path as alt text,
any text is under 9 pt, or a retired term is found (site/tools/drift.py --terms).
Reports the share of text under 10.5 pt per slide: body text should be 11 pt or more, so only labels,
chips, captions and footers belong there.

Rendering needs LibreOffice (soffice) and pdftoppm. Without Segoe UI installed the preview uses a fallback
font, which is slightly wider: text that fits in the preview fits in PowerPoint.
"""
import collections, glob, os, re, shutil, subprocess, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DECKS = {"full": "Adaptable-Multi-Region-Azure-Platform-Full.pptx", "exec": "Adaptable-Multi-Region-Azure-Platform-Executive.pptx"}
MIN_PT, BODY_PT = 9.0, 10.5


def slides(z):
    names = [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)]
    return sorted(names, key=lambda n: int(re.findall(r"\d+", n)[0]))


def check(path):
    z = zipfile.ZipFile(path)
    problems, sizes, small = [], collections.Counter(), {}
    for n in slides(z):
        i = int(re.findall(r"\d+", n)[0])
        x = z.read(n).decode("utf-8")
        titles = re.findall(r'<p:sp>(?:(?!</p:sp>).)*?<p:ph type="title"/>.*?</p:sp>', x, flags=re.S)
        if len(titles) != 1:
            problems.append(f"slide {i}: {len(titles)} title placeholders (need exactly 1)")
        elif not re.sub(r"<[^>]+>", "", "".join(re.findall(r"<a:t>[^<]*</a:t>", titles[0]))).strip():
            problems.append(f"slide {i}: empty title")
        for d in re.findall(r'<p:pic>.*?<p:cNvPr [^>]*?descr="([^"]*)"', x, flags=re.S):
            if not d.strip() or "/" in d or "\\" in d:
                problems.append(f"slide {i}: picture alt text is {'empty' if not d.strip() else 'a file path'}: {d[:60]!r}")
        tot = sm = 0
        for run in re.findall(r"<a:r>(.*?)</a:r>", x, flags=re.S):
            t = "".join(re.findall(r"<a:t>([^<]*)</a:t>", run))
            m = re.search(r'<a:rPr[^>]*\bsz="(\d+)"', run)
            if not t.strip() or not m:
                continue
            pt = int(m.group(1)) / 100
            tot += len(t)
            sizes["<9" if pt < 9 else "9–10.4" if pt < BODY_PT else "10.5–11.9" if pt < 12 else "12+"] += len(t)
            if pt < MIN_PT:
                problems.append(f"slide {i}: {pt:g} pt text {t[:40]!r} (minimum {MIN_PT:g})")
            if pt < BODY_PT:
                sm += len(t)
        if tot:
            small[i] = sm / tot
    total = sum(sizes.values()) or 1
    print(f"{os.path.basename(path)}: {len(slides(z))} slides")
    print("  text by size: " + ", ".join(f"{k} pt {100 * sizes[k] / total:.0f}%" for k in ["<9", "9–10.4", "10.5–11.9", "12+"]))
    dense = [(i, s) for i, s in sorted(small.items()) if s > 0.25]
    if dense:
        print("  slides with more than 25% of text under 10.5 pt: " + ", ".join(f"{i} ({100 * s:.0f}%)" for i, s in dense))
    drift = subprocess.run([sys.executable, os.path.join(ROOT, "site", "tools", "drift.py"), path, "--terms"], capture_output=True, text=True)
    for line in drift.stdout.splitlines():
        if line.startswith(("RETIRED", "MISSING")):
            problems.append(line)
    for p in problems:
        print("  FAIL " + p)
    print("  " + ("no problems" if not problems else f"{len(problems)} problem(s)"))
    return not problems


def render(path, key, only):
    out = os.path.join(HERE, "out", "preview", key)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    work = tempfile.mkdtemp(prefix="deck-qa-")
    try:
        # a private profile so several conversions can run at once
        subprocess.run(["soffice", f"-env:UserInstallation=file://{work}/profile", "--headless", "--convert-to", "pdf", "--outdir", work, path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pdf = os.path.join(work, os.path.splitext(os.path.basename(path))[0] + ".pdf")
        subprocess.run(["pdftoppm", "-jpeg", "-r", "80", pdf, os.path.join(work, "s")], check=True)
        files = sorted(glob.glob(os.path.join(work, "s-*.jpg")))
        kept = []
        for f in files:
            n = int(re.findall(r"-(\d+)\.jpg$", f)[0])
            if only and n not in only:
                continue
            dst = os.path.join(out, f"slide-{n:02d}.jpg")
            shutil.move(f, dst)
            kept.append((n, dst))
    finally:
        shutil.rmtree(work, ignore_errors=True)
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print(f"  rendered {len(kept)} slides to {out} (install Pillow for contact sheets)")
        return
    for k in range(0, len(kept), 6):
        group = kept[k:k + 6]
        ims = [Image.open(f) for _, f in group]
        w, h = ims[0].size
        sheet = Image.new("RGB", (2 * w + 10, ((len(ims) + 1) // 2) * (h + 10) - 10), "#777777")
        draw = ImageDraw.Draw(sheet)
        for j, (im, (n, _)) in enumerate(zip(ims, group)):
            r, c = divmod(j, 2)
            sheet.paste(im, (c * (w + 10), r * (h + 10)))
            draw.rectangle([c * (w + 10), r * (h + 10), c * (w + 10) + 44, r * (h + 10) + 22], fill="#C00000")
            draw.text((c * (w + 10) + 8, r * (h + 10) + 5), str(n), fill="#FFFFFF")
        sheet.save(os.path.join(out, f"sheet-{group[0][0]:02d}-{group[-1][0]:02d}.jpg"), quality=88)
    print(f"  rendered {len(kept)} slides and contact sheets to {out}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    key = args[0]
    path = os.path.join(HERE, "out", DECKS[key]) if key in DECKS else key
    only = [int(a) for a in args[1:] if a.isdigit()]
    ok = check(path)
    if "--render" in sys.argv:
        render(path, key if key in DECKS else "custom", only)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
