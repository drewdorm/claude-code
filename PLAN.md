# Garden Manager — Product Plan

A mobile-friendly web app for managing a home garden in Marietta, Georgia (Cobb County).

> Status: **planning only**. No app code yet. See [Open questions](#7-open-questions) before building.

---

## 1. Goals

- Know **what is planted where**, across raised beds and in-ground areas.
- Know **what to do this week** (start seeds, transplant, harvest) based on local frost dates.
- Get **stage-specific tips** for each crop.
- Keep a **photo history** of each plant and bed.
- Have the app **suggest each plant's current stage and next steps**, from planting dates first and photos later.

Main device: phone, out in the garden. Desktop should also work.

### Local growing assumptions (to confirm)

| Setting | Starting value | Notes |
|---|---|---|
| USDA zone | **7b / 8a** | Marietta is 7b on the 2012 map. The 2023 map puts most of Cobb County in 8a. |
| Average last spring frost | **~April 1** | Usually late March to early April. |
| Average first fall frost | **~November 1** | Usually late October to early November. |
| Growing season | ~210 days | Long enough for spring and fall crops, plus a summer gap for some. |

These are stored as **editable settings** so the whole calendar moves if you change them.

---

## 2. Main screens

1. **Today (home)**: tasks due this week and next ("Start pepper seeds indoors", "Harvest cucumbers in Bed 2"), recent photos, and a "+ Photo" button.
2. **Garden map / list**: every bed and area as a card showing name, size, what's growing, and its latest photo. Tap a card to open it.
3. **Bed / area detail**: size, sun exposure, current plantings, past seasons (to help with crop rotation), and a photo timeline.
4. **Planting detail**: crop and variety, key dates (seeded, transplanted, expected harvest), current stage with a progress bar, tips for that stage, the next suggested step, photos, and notes.
5. **Calendar**: month view or list of what to start, transplant, and harvest, built from frost dates and your plantings. You can filter by crop or bed.
6. **Crop library**: the crop list (tomato, pepper, cucumber, squash, corn, beans, herbs, flowers, blueberry) with timing rules and tips for each stage. You can edit it and add crops.
7. **Add photo**: take or upload a photo, tag it to a planting or bed, and add an optional note. In later phases, this shows the AI's stage suggestion for you to confirm.
8. **Settings**: frost dates, zone, units (ft/in), and your account.

---

## 3. Data model

Plain-language version: a **Bed** holds many **Plantings** over time. Each Planting is one **Crop** (from the library) and moves through **Stages**. **Photos** attach to a Planting or a Bed. **Tips** belong to a Crop and Stage. **Tasks** are generated from all of this.

```
Garden settings ─┐
                 │
Bed/Area 1 ── * Planting * ── 1 Crop 1 ── * StageTip
   │                │
   * Photo          * Photo
                    * Task
                    * StageEvent (history of stage changes)
```

### Tables

**garden_settings** (one row)
- `zone`, `last_frost_date`, `first_frost_date`, `units`

**beds**
- `id`, `name` (e.g. "Bed 1 – North")
- `type`: `raised_bed` | `in_ground` | `container`
- `length`, `width` (and optional `depth` for raised beds)
- `sun`: `full` | `partial` | `shade`
- `notes`, `cover_photo_id`, `archived`

**crops** (the library; comes pre-filled and you can edit it)
- `id`, `name` (Tomato), `category` (vegetable / herb / flower / fruit)
- `perennial` (true for blueberries and some herbs)
- Timing rules, all in days relative to frost dates:
  - `start_indoors_offset` (e.g. tomato: −49, which means 7 weeks before last frost)
  - `transplant_offset` (e.g. tomato: +14)
  - `direct_sow_offset` (e.g. beans: +7)
  - `days_to_maturity` (default; can be changed per variety)
  - `fall_planting_ok`, `spacing_in`
- `stages`: the ordered list of stages for this crop (see below)

**stage_tips**
- `crop_id`, `stage`, `title`, `body`, `what_to_look_for` (visual cues that a later phase can use for photo checks)

**plantings** (one crop in one bed for one season)
- `id`, `bed_id`, `crop_id`, `variety` ("Cherokee Purple")
- `quantity` / `area_used`
- `method`: `seed_indoors` | `direct_sow` | `transplant_bought`
- Dates: `seeded_on`, `transplanted_on`, `first_harvest_on`, `ended_on`
- `current_stage`, `stage_source`: `manual` | `date_estimate` | `photo_ai`
- `status`: `planned` | `active` | `done` | `failed`
- `notes`

**stage_events** (history of stage changes, so you can see how the season went)
- `planting_id`, `stage`, `date`, `source`, `confidence` (for AI suggestions)

**photos**
- `id`, `planting_id` (optional), `bed_id` (optional), `taken_at`, `storage_path`, `caption`
- `ai_analysis` (JSON, filled in Phase 3: suggested stage, issues seen, confidence)

**tasks**
- `id`, `planting_id` / `bed_id`, `type` (start, transplant, water, fertilize, harvest, custom), `due_on`, `done_on`, `auto_generated`

### Stages

A standard set that each crop can trim or rename:

`planned → seeded → germinated → seedling → transplanted → vegetative → flowering → fruiting → harvest → done`

Blueberries (perennial) loop each year instead: `dormant → bud break → flowering → fruiting → harvest → post-harvest`.

---

## 4. How "automatic updates" will work

These come in layers, so the app is useful long before any AI is added.

1. **Date-based estimates (Phase 2).** Example: seeded on March 1, and tomatoes germinate in about 7 days and transplant at about 6–8 weeks. The app estimates the stage from those numbers and creates tasks. This is plain arithmetic and costs nothing.
2. **You confirm.** One tap ("Yes, it's flowering") records a stage event and moves future estimates.
3. **Photo analysis (Phase 3).** When you upload a photo, the app sends it to an AI vision model (Claude, from Anthropic) with the crop, the planting date, and that stage's "what to look for" notes. The AI returns a suggested stage, a confidence level, and any problems it sees (yellow leaves, pests, blossom-end rot). **You always confirm**; the app never changes a stage silently.

---

## 5. Recommended tech stack

Chosen to be beginner-friendly, low-cost (free tiers cover a single home gardener), and well documented.

| Piece | Choice | Why, in plain language |
|---|---|---|
| Language | **TypeScript** | JavaScript with type checks that catch mistakes before you run the code. Front end and back end use the same language. |
| App framework | **Next.js** (React) | A popular, well-documented way to build one web app that has both the screens and the small server code. Tutorials and help are easy to find. |
| Styling | **Tailwind CSS** | Lets you style elements directly in the markup. It makes phone-first layouts easy without writing separate CSS files. |
| Database, login, photo storage | **Supabase** | One hosted service that provides a Postgres database, user login, and file storage for photos. It has a web dashboard where you can see and edit your data directly. The free tier is enough here. |
| Hosting | **Vercel** | Connect the GitHub repo and every push deploys automatically. Free for personal projects. |
| "Install on phone" | **PWA** (Progressive Web App) | Lets you add the site to your home screen like an app and open the camera from it. No app store needed. |
| Photo analysis (Phase 3) | **Claude API** (`claude-opus-5-5`, with image input) | Reads a photo and answers questions such as "what growth stage is this tomato in?". Pricing is per use, likely a few cents a month for a home garden. A cheaper model can be swapped in later if you want. |

**Skipped on purpose for now:** native iOS/Android apps, a separate backend server, weather APIs, and complex state libraries. Any of these can be added later if needed.

---

## 6. Phased roadmap

### Phase 1 (MVP): "What's planted where"
Goal: replace the notebook or spreadsheet. Use it for one season.
- Login (just you).
- Create, edit, and archive beds and areas (name, type, size, sun).
- Add plantings to a bed (crop, variety, dates, stage set by hand, notes).
- Pre-filled crop library with your 9 crop types.
- Upload photos to a planting or bed, shown as a simple timeline.
- Phone-first layout, installable as a PWA.

### Phase 2: Calendar and tips
- Frost-date settings.
- Calendar built from crop timing rules (spring and fall windows).
- "Today" screen with upcoming tasks.
- Stage tips on each planting.
- Date-based stage estimates and one-tap stage confirmation.

### Phase 3: Smart photos
- AI photo analysis gives a suggested stage and spots likely problems (pest or disease).
- Accept or reject the suggestion; keep a history of AI suggestions.
- "Next step" suggestions that combine the date, stage, and photo.

### Phase 4: Nice-to-haves
- Visual bed layout (grid or square-foot view).
- Crop rotation warnings ("tomatoes were in Bed 2 last year").
- Weather and frost alerts (e.g. from the National Weather Service API).
- Harvest log (weights and counts) with season summaries.
- Push or email reminders.
- Share read-only access with family.

---

## 7. Open questions

Please answer these before building starts:

1. **Users:** Is it just you, or will family members log in and edit too?
2. **Frost dates:** Are you OK with ~April 1 and ~November 1 as defaults, or do you have dates from your own experience?
3. **Bed list:** Can you list your beds and areas with rough sizes? I'll pre-load them.
4. **Bed layout:** Is a simple list of what's in each bed enough, or do you want to place plants on a grid/map (Phase 4)?
5. **Crop detail:** Should the app track varieties (e.g. "Cherokee Purple" vs. "Sungold") with their own days-to-maturity, or just crop types?
6. **Seed starting:** Do you start seeds indoors, buy transplants, or both? It changes which tasks appear.
7. **Fall garden:** Do you plant a second round in late summer (beans, squash, cucumbers)?
8. **Tips source:** Is it OK if I write the starter tips based on general Southeast/UGA Extension guidance? You'd be able to edit them.
9. **AI photo analysis:** Are you comfortable with photos being sent to an outside AI service (Anthropic) for analysis, and with a small pay-per-use cost? Roughly how many photos a week do you expect?
10. **Accounts:** Are you OK creating free accounts on GitHub, Supabase, and Vercel? I'll walk you through each step.
11. **Offline use:** Is phone signal reliable in your garden, or does the app need to save entries offline and sync later?
12. **Reminders:** Do you want notifications (push or email), or is checking the "Today" screen enough?
13. **Past data:** Do you have past records (spreadsheet, notes, photos) to import?
