# pečka — demo koncept

Demo spletna stran izmišljene picerije: glavna stran (hero, ponudba z vrtečo zanko, o nas, lokacija) in sestavljalnik pice
(sestavi, glej račun, speci, dobi zaprto škatlo). Vite + React + TypeScript + Framer Motion + React Router (HashRouter), brez zalednega dela.

Naslovi: `/#/` glavna stran, `/#/sestavi` sestavljalnik (`?pica=vrazja` vnaprej doda sestavine pice),
`/#/ponudba`, `/#/o-nas`, `/#/lokacija` pokažejo glavno stran in zdrsnejo do sekcije.

## Zagon

```bash
npm install
npm run dev        # razvoj
npm run build      # statična stran v dist/
```

## Objava na GitHub Pages

1. Na GitHubu ustvari nov repozitorij (npr. `pecka`), v njem je lahko prazno.
2. V mapi projekta:
   ```bash
   git init
   git add .
   git commit -m "Pečka demo"
   git branch -M main
   git remote add origin https://github.com/<uporabnik>/pecka.git
   git push -u origin main
   ```
3. V repozitoriju: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Ob vsakem pushu na `main` workflow `.github/workflows/deploy.yml` stran zgradi in objavi. Potek vidiš v zavihku **Actions**;
   naslov je `https://<uporabnik>.github.io/pecka/`.

HashRouter in `base: "./"` poskrbita, da stran deluje na poljubni podpoti brez dodatnih nastavitev.
Naslov za deljenje (`og:image`) workflow nastavi sam; pri lastni domeni ga vpiši v `.env` (`VITE_SITE_URL`).

## Kaj zamenjati za drugo stranko

- `src/data/ingredients.ts`: sestavine, cene, število kosov, velikosti, plasti, cena osnove in dostave.
- `src/data/menu.ts`: ponudba (cene se izračunajo iz sestavljalnika).
- `src/data/site.ts`: naslov, telefon, delovni čas.
- `src/components/Footer.tsx`: konstanti `AGENCY_NAME` in `AGENCY_URL` (zdaj `[IME AGENCIJE]`, `[POVEZAVA]`).
- `public/img/`: slike (glej spodaj). `src/lib/layout.ts`: `SEED` spremeni razporeditev kosov. `src/lib/timing.ts`: trajanje peke.

## Priprava slik

Izvirne slike so v `assets-src/`. Skripta jim odstrani ozadje (rembg), naredi prozorne luknje v kolobarjih, razreže liste na
kose, poravna surovo/pečeno, pripravi menijske pice in pomanjša fotografije:

```bash
python -m venv .venv
.venv\Scripts\pip install rembg scipy pillow numpy onnxruntime
.venv\Scripts\python scripts\prepare-assets.py   # izhod: public/img/*.webp + manifest.json
```

Model `isnet-general-use.onnx` mora biti v `.cache/u2net/` (ali pusti, da ga rembg prenese sam).
