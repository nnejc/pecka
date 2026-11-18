/** Build the URL of a file in public/img (works under any Vite base path). */
export function img(name: string): string {
  return `${import.meta.env.BASE_URL}img/${name}.webp`;
}

export interface Manifest {
  pieces: Record<string, { n: number; w: number; h: number }[]>;
  images: Record<string, { w: number; h: number }>;
}

let manifestPromise: Promise<Manifest> | null = null;

/** Written by scripts/prepare-assets.py: piece counts and image sizes. */
export function loadManifest(): Promise<Manifest> {
  manifestPromise ??= fetch(`${import.meta.env.BASE_URL}img/manifest.json`).then((r) => r.json());
  return manifestPromise;
}

/** Every image the app can show, so nothing pops in later. */
export async function allImageUrls(): Promise<string[]> {
  const m = await loadManifest();
  const urls: string[] = Object.keys(m.images).map(img);
  for (const [id, pieces] of Object.entries(m.pieces)) {
    for (const p of pieces) {
      urls.push(img(`${id}-${p.n}-raw`), img(`${id}-${p.n}-baked`));
    }
  }
  return urls;
}

function preloadOne(url: string): Promise<void> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve();
    im.onerror = () => resolve();
    im.src = url;
  });
}

let preloaded = false;
/** True once the builder's pictures were loaded in this visit (skip the loader next time). */
export const isPreloaded = () => preloaded;

export async function preloadAll(minMs = 600): Promise<void> {
  const started = performance.now();
  try {
    const urls = await allImageUrls();
    // the logo is set in Bricolage Grotesque: wait for it so it never flashes a fallback font
    const fonts = document.fonts
      ? Promise.all(['800 1em "Bricolage Grotesque"', '500 1em "Bricolage Grotesque"'].map((f) => document.fonts.load(f))).catch(() => {})
      : Promise.resolve();
    // never keep the visitor on the loader for more than 8 s (slow network)
    await Promise.race([
      Promise.all([fonts, ...urls.map(preloadOne)]),
      new Promise((r) => setTimeout(r, 8000)),
    ]);
  } catch {
    /* if the manifest fails the UI still opens */
  }
  const wait = minMs - (performance.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  preloaded = true;
}
