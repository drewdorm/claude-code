# Garden Manager — Product Plan

A mobile-friendly web app for managing a home garden in Marietta, Georgia (Cobb County).

> Status: **planning only**. No app code yet. Most open questions are answered (see [Decisions](#7-decisions-made)). A few small ones remain in [Open questions](#8-open-questions).

## Who uses it

Test version (Phase 1): just you, on your phone. Shared version (from Phase 1.5): two people share **one garden** and can both view and edit everything. Sign-up is invite-only, so only those two email addresses can log in. Every photo, note, and stage change records who made it.

## The garden (pre-loaded at setup)

| Count | Name pattern | Type | Size | Area each |
|---|---|---|---|---|
| 4 | Raised Bed 1–4 | Raised bed | 6 ft × 3 ft, 1 ft deep | 18 sq ft |
| 4 | Raised Bed 5–8 | Raised bed | 6 ft × 3 ft, 2 ft deep | 18 sq ft |
| 6 | Round Bed 1–6 | Round container | 2 ft diameter, 2 ft tall | ~3.1 sq ft |
| 1 | In-Ground Plot | In-ground | 10 ft × 30 ft | 300 sq ft |
| 4 | Wall Bed 1–4 | Retaining-wall bed | 5 ft × 20 ft | 100 sq ft |

That's **19 growing spaces and about 860 sq ft** in total. You can rename any of them, for example "Raised Bed 3 – by the fence".

The 2-ft-deep raised beds and the round containers suit deep-rooted or perennial crops (tomatoes, blueberries, which need acidic soil and fit well in a container). The app won't enforce this, but tips can mention it.

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
6. **Seed-starting shelf**: seedlings growing indoors that haven't gone into a bed yet, with their sow date and target transplant date. A "Transplant" button asks which bed they're going into.
7. **Crop library**: the crop list (tomato, pepper, cucumber, squash, corn, beans, herbs, flowers, blueberry) with timing rules and tips for each stage. You can edit it and add crops.
8. **Add photo**: take or upload a photo, tag it to a planting or bed, and add an optional note. In later phases, this shows the AI's stage suggestion for you to confirm.
9. **Settings**: frost dates, zone, units (ft/in), and the two user accounts.

---

## 3. Data model

Plain-language version: a **Bed** holds many **Plantings** over time. Each Planting is one **Variety** of a **Crop** (from the library) and moves through **Stages**. **Photos** attach to a Planting or a Bed. **Tips** belong to a Crop and Stage. **Tasks** are generated from all of this.

```
Garden settings ─┐
                 │
Bed/Area 1 ── * Planting * ── 1 Variety * ── 1 Crop 1 ── * StageTip
   │                │
   * Photo          * Photo
                    * Task
                    * StageEvent (history of stage changes)
```

### Tables

**garden_settings** (one row)
- `zone`, `last_frost_date`, `first_frost_date`, `units`

**profiles** (the two users)
- `id`, `display_name`, `email`
- Photos, stage events, tasks and notes carry a `created_by` that points here.

**beds**
- `id`, `name` (e.g. "Raised Bed 1")
- `type`: `raised_bed` | `in_ground` | `container` | `wall_bed`
- `shape`: `rect` | `round`
- `length_ft`, `width_ft` for rectangles, or `diameter_ft` for round beds, plus `depth_ft`
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
  - **Fall planting** is counted backward from the first fall frost: last sow date = first frost − (days to maturity + ~14 days, because plants grow more slowly as days shorten). Example: bush beans (55 days) should be sown by about August 23 for a November 1 frost.
- `stages`: the ordered list of stages for this crop (see below)

**varieties** (specific cultivars, e.g. "Sungold", "Cherokee Purple", "Silver Queen")
- `id`, `crop_id`, `name`
- `days_to_maturity` (overrides the crop default)
- `growth_habit` (e.g. determinate or indeterminate for tomatoes, bush or pole for beans)
- `seed_source`, `notes`, `photo_id`
- Optional timing overrides (`start_indoors_offset`, `transplant_offset`), for when a variety differs from the crop default

**stage_tips**
- `crop_id`, `stage`, `title`, `body`, `what_to_look_for` (visual cues that a later phase can use for photo checks)

**plantings** (one variety in one bed for one season)
- `id`, `bed_id` (**left empty while seedlings are still in trays indoors**, then set at transplant), `crop_id`, `variety_id`
- `season`: `spring` | `summer` | `fall`, and `year`
- `quantity` / `area_used`
- `method`: `seed_indoors` | `direct_sow` | `transplant_bought` (you use all three)
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
| App framework | **React + Vite** | React is the most popular way to build app screens. Vite is the tool that runs and packages it. Together they produce a plain website with no server needed, which is the simplest thing to host. |
| Styling | **Tailwind CSS** | Lets you style elements directly in the markup. It makes phone-first layouts easy without writing separate CSS files. |
| Storage, test version | **On the phone** (browser database, via the Dexie library) | Data and photos are saved on your phone, with no accounts needed. |
| Storage, shared version (later) | **Supabase** | One hosted service that provides a database, login, and photo storage, so you and Sydney see the same garden. It replaces the phone storage once you're happy with the app. Free tier. |
| Hosting | **GitHub Pages** | Free website hosting from the GitHub account you already have. Every push to the repo updates the app. |
| "Install on phone" | **PWA** (Progressive Web App) | Lets you add the site to your home screen like an app and open the camera from it. No app store needed. |
| Photo analysis (Phase 3) | **Claude API** (`claude-opus-5-5`, with image input) | Reads a photo and answers questions such as "what growth stage is this tomato in?". Pricing is per use, likely a few cents a month for a home garden. A cheaper model can be swapped in later if you want. |

**Skipped on purpose for now:** native iOS/Android apps, a separate backend server, weather APIs, and complex state libraries. Any of these can be added later if needed.

---

## 6. Phased roadmap

### Phase 1 (MVP): "What's planted where", phone-only test
Goal: try the app on your phone with real beds and plantings before committing to accounts.
- All data and photos stored on your phone. No login, and no accounts beyond GitHub.
- Hosted on GitHub Pages. Open the link on your phone and choose "Add to Home Screen".
- An **Export / Import backup** button that saves everything to a file you can keep in iCloud, Google Drive, or email.
- Photos are shrunk when saved (to about 1600 px wide), so the phone's storage doesn't fill up.
- All app code talks to storage through one small "data layer", so swapping in Supabase later only changes that one part.
- The 19 beds and areas above, pre-loaded, with editing and archiving.
- Pre-filled crop library with your 9 crop types, and a place to add your varieties.
- Add plantings (variety, method, season, dates, stage set by hand, notes), including seedlings indoors that don't have a bed yet.
- Upload photos to a planting or bed, shown as a simple timeline.
- Phone-first layout, installable as a PWA.

### Phase 1.5: Share with Sydney
Do this once the test version feels right.
- Create a free Supabase account (about 15 minutes, guided).
- Switch the data layer to Supabase and add invite-only login for two users.
- Import your phone backup, so nothing entered during testing is lost.

### Phase 2: Calendar and tips
- Frost-date settings.
- Calendar built from crop and variety timing rules (spring windows, plus fall windows counted back from first frost).
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

---

## 7. Decisions made

| Topic | Decision |
|---|---|
| Users | **Test version:** just you, on your phone. **Shared version (Phase 1.5):** two people share one garden, both can edit, and login is invite-only. |
| Hosting / accounts | GitHub Pages only (an account you already have). Supabase is added in Phase 1.5, and Vercel isn't needed. |
| Beds | 19 spaces, pre-loaded (see the table at the top). |
| Varieties | Tracked per planting, each with its own days to maturity and timing. |
| Seed starting | Both indoor starts and bought transplants. Seedlings can exist before they have a bed. |
| Fall garden | Yes. The calendar adds fall sowing windows. |
| Offline use | Not needed, because signal is reliable. This keeps the app simpler. |
| Tips | Starter tips will be written from general Southeast / UGA Extension guidance, and you can edit them. |
| Photo AI | Planned for Phase 3, using the default setup in the tech stack. The cost should be pennies a month, and a cheaper model can be swapped in if you want. |
| Approach | Personal use, so the most efficient choice wins: one shared garden, no multi-tenant features, free tiers, and no app-store builds. |

## 8. Open questions

These don't block starting Phase 1, and sensible defaults are used until you answer:

1. **Frost dates:** OK to start with ~April 1 (last spring frost) and ~November 1 (first fall frost)? Default: yes. You can change them in Settings.
2. **Reminders:** Do you want push notifications, or is the "Today" screen enough? Default: Today screen only, with reminders in Phase 4.
3. **Past data:** Is there any old spreadsheet or photo history to import? Default: start fresh.
4. **Bed names:** Do you want real names (e.g. "Wall Bed – Top Tier") instead of numbers? Default: numbered names, which you can rename any time.
5. **Phone:** iPhone or Android? iPhones can clear website storage for apps that aren't added to the home screen, so on iPhone, install it to the home screen and export backups regularly.
6. **Repo visibility:** GitHub Pages is free for public repos (anyone could read the code, but **not** your garden data, which stays on your phone). Hosting from a private repo needs a paid GitHub plan. Is a public repo OK?
