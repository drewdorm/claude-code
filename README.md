# Garden

A phone-first web app for managing our home garden in Marietta, GA: beds, plantings, varieties, seedlings and photo history. See [PLAN.md](PLAN.md) for the full plan and roadmap.

**Test version:** all data and photos are stored on the phone itself. Use **More → Settings & backup** to save a backup file regularly.

Live app: https://drewdorm.github.io/claude-code/

## Install on iPhone

1. Open the link above in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open it from the Home Screen icon from now on. This helps iOS keep your data.

## Run it locally

```bash
npm install
npm run dev      # open the "Network" address on your phone (same Wi-Fi)
npm run build    # production build into dist/
```

## Where things are

- `src/data/` – the data layer (on-phone database, starter beds and crops, backup). Swapping in Supabase later only changes this folder.
- `src/screens/` – one file per screen.
- `src/components/` – shared pieces (tab bar, photo grid, form controls).
- `.github/workflows/deploy.yml` – publishes the app to GitHub Pages on every push to `main`.
