# Guitar Practice

A full-stack web app that listens to your guitar through the microphone, detects which chord you're playing in real time, and guides you through a structured learning curriculum — with a Guitar Hero-style practice mode, a chromatic tuner, and an AI assistant that generates custom progressions from your learned chords.

---

## Features

| Feature | Description |
|---|---|
| **Chord detection** | Meyda.js extracts a chromagram from the mic; cosine similarity matches it against chord templates |
| **Flashcard mode** | Learn each chord one at a time — play and hold it to advance |
| **Guitar Hero mode** | Chords scroll toward a hit line; play in time to score. Practice mode pauses on a miss; Test mode never stops |
| **Chromatic tuner** | Pitchy McLeod pitch detection; needle gauge shows cents sharp/flat |
| **AI chatbot** | GPT-4o generates progressions using only your learned chords; load them into practice with one click |
| **Progress tracking** | Prisma + SQLite; per-user learned chords and session history |
| **Auth** | Email/password (bcrypt + NextAuth v5 JWT sessions) |

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Prisma 6 + SQLite |
| Auth | NextAuth v5 (Auth.js) — credentials provider, JWT |
| Chord detection | Meyda.js (`chroma` feature) |
| Pitch detection | pitchy (McLeod method) |
| Animations | Framer Motion |
| Metronome | Tone.js |
| AI | OpenAI SDK — gpt-4o, server-side streaming |

---

## How It Works

### Chord Detection Pipeline

```
getUserMedia({ audio: true })
  → AudioContext → MediaStreamSourceNode
  → Meyda.createMeydaAnalyzer({ featureExtractors: ['chroma'] })
  → chroma[12] per frame   (C=0, C#=1, … B=11)
  → ChromagramSmoother: rolling average over 15 frames
  → cosineSimilarity(smoothed, chordTemplate) for each known chord
  → return best match above 0.55 threshold
```

Each chord is defined as a 12-element pitch-class vector in `src/lib/chords.ts`. The smoother reduces jitter from brief dropouts — the detection window tolerates up to ~250ms of silence before the confidence drops below threshold.

**Chord templates** use a consistent string convention throughout:
- `openStrings[0]` = Low E string, `openStrings[5]` = High e string
- Value `0` = open string, `-1` = muted/skip, `>0` = fret number

### Flashcard Mode (`/learn/[chord]`)

The student sees an SVG chord diagram. The mic runs the detection pipeline continuously. When the detected chord matches the target, a hold timer starts (1.5 s). A 700 ms grace period prevents the timer from resetting on brief dropouts (normal for beginners). On confirmation, progress is saved to the DB and the next chord unlocks.

### Guitar Hero Mode (`/practice`)

Chord blocks are scheduled as a time-ordered list (`ChordBlock[]`). Each block has a `startTime` — the millisecond at which it should reach the hit line. A `requestAnimationFrame` loop runs every frame:

1. Computes `timeToHit = block.startTime - gameTime` for each block
2. Maps `timeToHit` to an x-position: `HIT_LINE_PCT + (timeToHit / HIGHWAY_DURATION_MS) * (100 - HIT_LINE_PCT)`
3. If `|timeToHit| < 1200ms` and the detected chord matches → **hit** (green flash, +10 pts)
4. If `timeToHit < -1200ms` and no hit → **miss**

**Practice mode**: on a miss, `gameTime` is frozen (the `startTimeRef` is not advanced). The highway pauses and shows a "Now play [chord]" overlay with a horizontal chord card. When the student plays the correct chord, `startTimeRef` is adjusted to resume from the frozen point seamlessly.

**String orientation**: the highway shows High e on top, Low E on bottom — matching how a guitar looks when you hold it. The "Up next" chord cards use the same horizontal orientation.

### Chromatic Tuner (`/tuner`)

Pitchy's `PitchDetector.forFloat32Array` runs the McLeod pitch method on each audio buffer. The detected frequency is mapped to the nearest semitone:

```
cents = 1200 × log₂(detected / nearest_note_frequency)
```

The needle gauge shows ±50 cents. The nearest standard guitar string is highlighted.

### AI Chatbot (`/chat`)

The server-side route (`POST /api/chat`) fetches the user's learned chords from the DB on every request, then builds a system prompt that lists **only those chords** and instructs GPT-4o to use no others. The prompt example JSON uses the user's actual chord names — so the model never sees chord names outside the allowed set.

When the response includes a JSON code block, the UI renders it as a loadable progression with a "Load into Practice" button that pushes the progression to `/practice` via URL params.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  Landing page
│   ├── layout.tsx                Root layout — MicrophoneProvider, Toaster
│   ├── dashboard/page.tsx        Progress overview (server component, DB reads)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── learn/
│   │   ├── page.tsx              Curriculum list (Em → F)
│   │   └── [chord]/page.tsx      Flashcard lesson
│   ├── practice/page.tsx         Guitar Hero mode
│   ├── tuner/page.tsx            Chromatic tuner
│   ├── chat/page.tsx             AI chatbot
│   └── api/
│       ├── auth/[...nextauth]/   NextAuth handler
│       ├── chat/route.ts         OpenAI proxy (server-side, keyed)
│       └── progress/route.ts     Read/write learned chords & sessions
├── components/
│   ├── ChordDetector.tsx         Meyda analyzer hook — calls onChordDetected
│   ├── ChordDiagram.tsx          SVG fretboard diagram (vertical, traditional)
│   ├── ChordHighway.tsx          Guitar Hero lane — gems, practice/test mode
│   ├── FlashcardMode.tsx         Hold-to-confirm chord practice
│   ├── Metronome.tsx             Tone.js BPM click track with mute
│   ├── MicrophoneSetup.tsx       Mic permission UI (uses global context)
│   ├── Tuner.tsx                 Pitch detection + needle UI
│   ├── ChatBot.tsx               Chat UI with streaming + progression parser
│   └── Navbar.tsx                Top navigation
├── contexts/
│   └── MicrophoneContext.tsx     Global mic stream — granted once, shared across pages
└── lib/
    ├── auth.ts                   NextAuth config (credentials, JWT, bcrypt)
    ├── chords.ts                 Chord templates, chromagrams, curriculum order
    ├── chordDetection.ts         Chromagram smoother + cosine similarity matcher
    ├── db.ts                     Prisma client singleton
    └── openai.ts                 OpenAI client + system prompt builder

prisma/
├── schema.prisma                 User, LearnedChord, PracticeSession
└── migrations/                  SQL migration history (auto-generated)
```

### Curriculum Order

`Em → Am → E → A → D → G → C → Dm → F`

Ordered easy to hard. Each chord unlocks after the previous is confirmed.

---

## Local Development

### Prerequisites

- Node.js 20+
- An OpenAI API key (for the chatbot; the rest of the app works without it)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env files from the examples
cp env.example .env
cp env.local.example .env.local
# Edit both files — add your OPENAI_API_KEY to .env and set AUTH_SECRET in .env.local

# 3. Push the schema to your local SQLite DB
npx prisma migrate deploy

# 4. Start the dev server
npm run dev
```

**`.env`** — read by the Prisma CLI and Next.js server:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-proj-..."   # optional — only needed for /chat
```

**`.env.local`** — loaded by Next.js on top of `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="any-random-string-for-local-dev"
```

> Both files are git-ignored. The example templates (`env.example`, `env.local.example`) are committed and safe to share.

The app runs at [http://localhost:3000](http://localhost:3000).

> **Microphone access**: the browser requires HTTPS (or localhost) to use `getUserMedia`. Local dev works out of the box; any other dev domain needs a cert.

---

## Deploying to Fly.io

The app ships as a Docker container with a persistent **Fly volume** for the SQLite database.

### Prerequisites

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) installed and logged in
- An OpenAI API key

### One-time setup

**1. Create the Fly app**

```bash
fly apps create your-app-name
```

Update `fly.toml` if you used a different name than `guitar-practice`:

```toml
app = "your-app-name"
```

**2. Create the persistent volume for SQLite**

```bash
fly volumes create guitar_data --region iad --size 1
```

Pick the region closest to you: `iad` (US East), `lax` (US West), `lhr` (London), `sin` (Singapore), etc.

**3. Set secrets**

Copy the example env file, fill in your values, then import:

```bash
cp env.fly.example .env.fly
# Edit .env.fly — fill in AUTH_SECRET, NEXTAUTH_URL, OPENAI_API_KEY
fly secrets import < .env.fly
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Set `NEXTAUTH_URL` to your app's public URL:

```
NEXTAUTH_URL=https://your-app-name.fly.dev
```

**4. Deploy**

```bash
fly deploy
```

The first deploy builds the Docker image, pushes it, and starts the machine. This takes a few minutes. The container runs `prisma migrate deploy` automatically on every startup before the Next.js server starts.

**5. Open the app**

```bash
fly open
```

### Subsequent deploys

```bash
fly deploy
```

That's it. Migrations run automatically. The SQLite data on the volume is preserved across deploys.

### Useful commands

```bash
fly logs                        # live log tail
fly ssh console                 # shell into the running machine
fly status                      # machine health
fly volumes list                # confirm volume exists and is attached
fly secrets list                # show which secrets are set (values hidden)

# Reset the database (destructive — deletes all data)
fly ssh console -C "rm /data/prod.db"
fly machine restart
```

### Architecture notes

- **SQLite + volume**: works well for a single-machine app. If you ever need to scale to multiple machines, migrate to Postgres (`fly postgres create`), update `schema.prisma` to use `provider = "postgresql"`, and update `DATABASE_URL`.
- **Auto-stop**: the machine sleeps when idle (`auto_stop_machines = "stop"`) and wakes on the next request. Cold start is ~1–2 seconds.
- **Secrets vs env**: `DATABASE_URL` is a secret (set via `fly secrets import`) so it never appears in the image or logs. Non-sensitive config (`PORT`, `NODE_ENV`) is in `fly.toml` `[env]`.

---

## Environment Variables Reference

| Variable | Where set | Description |
|---|---|---|
| `DATABASE_URL` | `.env` / Fly secret | SQLite path. Local: `file:./dev.db`. Fly: `file:/data/prod.db` |
| `AUTH_SECRET` | `.env.local` / Fly secret | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | `.env.local` / Fly secret | Full public URL of the app |
| `OPENAI_API_KEY` | `.env` / Fly secret | OpenAI API key (only required for `/chat`) |

> **Never commit `.env`, `.env.local`, or `.env.fly`** — they contain real secrets.
