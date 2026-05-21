# LinguaDuo Frontend

The frontend for LinguaDuo — a real-time multilingual chat app. Built with Next.js 14 (App Router), it delivers a dark-themed WhatsApp-style experience where every message appears in the reader's own language, automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Inline styles + CSS variables (dark theme) |
| State Management | Zustand (`authStore`) |
| HTTP Client | Axios (`lib/api.ts`) |
| Real-time | Native WebSocket API |
| Icons | Lucide React |
| Deployment | Netlify |

---

## Features

- Dark theme WhatsApp-style UI
- Real-time messaging via WebSockets
- Group chat with admin controls (add/remove members)
- Direct messages (DMs)
- Per-sender colored usernames in group chat
- Automatic message translation — each user sees messages in their language
- Original message shown subtly below the translation
- 130+ language selection at registration
- Mobile responsive — sidebar hides when a chat is open
- Hydration-safe auth (no redirect to login on page refresh)
- Online presence indicators

---

## Project Structure

```
linguaduo/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   ├── layout.tsx          # Sidebar + layout shell
│   │   │   ├── page.tsx            # Chat list landing
│   │   │   ├── [room]/
│   │   │   │   └── page.tsx        # Individual chat room
│   │   │   └── create-group/
│   │   │       └── page.tsx        # Create group page
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx              # Root layout + CSS variables
│   ├── store/
│   │   └── authStore.ts            # Zustand auth state
│   └── lib/
│       └── api.ts                  # Axios instance with JWT headers
├── public/
├── next.config.js
└── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- LinguaDuo backend running locally or on Render

### Steps

```bash
# Clone the repo
git clone https://github.com/SanaAdeelKhan/linguaduo.git
cd linguaduo

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Fill in your values (see Environment Variables below)

# Start development server
npm run dev
```

App runs at `http://localhost:3000`

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

For production (Netlify), set:

```env
NEXT_PUBLIC_API_URL=https://linguaduo-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://linguaduo-backend.onrender.com
```

---

## Key Components

### `chat/layout.tsx`
The main shell. Contains the sidebar with:
- Chats, Users, and Groups tabs
- Search bar
- Online indicators
- Logout button
- Responsive show/hide logic (mobile vs desktop)

### `chat/[room]/page.tsx`
The chat room. Handles:
- WebSocket connection lifecycle
- Message history on load
- Real-time incoming messages
- Group member management (admin panel)
- Message bubbles with translated + original text
- Per-sender unique colors

### `store/authStore.ts`
Zustand store persisting `user` and `access` token across sessions. Includes `_hasHydrated` flag to prevent redirect flash on refresh.

---

## Design System

CSS variables defined in the root layout:

| Variable | Usage |
|---|---|
| `--bg-primary` | Main background (`#0d1117`) |
| `--bg-secondary` | Input/card backgrounds |
| `--bg-tertiary` | Header/footer bars |
| `--bubble-mine` | Sent message bubble |
| `--bubble-theirs` | Received message bubble |
| `--gold` | Brand accent (`#d4af37`) |
| `--purple` | Secondary accent |
| `--olive` | Online/success indicators |
| `--pink` | Error/remove actions |
| `--text-primary` | Main text |
| `--text-dim` | Timestamps, metadata |
| `--border` | Subtle dividers |

---

## Deployment (Netlify)

Live URL: `https://thelinguaduo.netlify.app`

**Build settings:**
- Build command: `npm run build`
- Publish directory: `.next`

**Required Netlify environment variables:**
```
NEXT_PUBLIC_API_URL=https://linguaduo-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://linguaduo-backend.onrender.com
```

---

## Responsive Behavior

| Screen | Behavior |
|---|---|
| Desktop (≥768px) | Sidebar (300px) + chat panel side by side |
| Mobile (<768px) | Sidebar OR chat panel — never both |

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ by Sana Adeel Khan — LinguaDuo: Chat without language barriers.*
