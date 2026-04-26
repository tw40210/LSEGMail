# Rotation Calendar

A full-stack web app for managing member rotation schedules with automatic Gmail notifications.

## Features

- **Calendar view** — monthly/weekly FullCalendar view of all rotation events; click any event to manually reassign the member
- **Rotation management** — create daily or weekly rotations, drag-and-drop to reorder members, recalculate events on demand
- **Members** — manage members (name + email), inline editing, search
- **Gmail integration** — connect a Gmail account via OAuth2; emails are sent automatically at 7 AM on the day of each event
- **Customizable templates** — configure subject/body email templates with `{name}`, `{email}`, `{date}` variables

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + TypeScript + Vite + Tailwind |
| Calendar  | FullCalendar 6                          |
| DnD       | @dnd-kit/core + @dnd-kit/sortable       |
| Backend   | Node.js + Express + TypeScript          |
| Database  | PostgreSQL 16                           |
| Email     | Gmail API (OAuth2) via googleapis       |
| Scheduler | node-cron                               |
| Hosting   | nginx (serves React build)              |
| Infra     | Docker Compose                          |

## Quick Start

### 1. Clone and configure

```bash
git clone <repo> rotation-calendar
cd rotation-calendar
cp .env.example .env
# Edit .env — at minimum set a POSTGRES_PASSWORD and SESSION_SECRET
```

### 2. Gmail OAuth2 setup (required for email sending)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Gmail API**
3. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URI: `http://YOUR_HOST/api/gmail/callback`
5. Copy Client ID and Secret into `.env`:
   ```
   GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=xxx
   GMAIL_REDIRECT_URI=http://YOUR_HOST/api/gmail/callback
   ```

### 3. Run

```bash
docker compose up --build -d
```

App is available at **http://localhost**

### 4. Connect Gmail

Open the app → click **Gmail** in the nav → **Sign in with Google** → authorize.

## Development (without Docker)

**Backend:**
```bash
cd backend
npm install
# Set DATABASE_URL in your shell
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend dev server proxies `/api` → `http://localhost:4000`.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /members | List all members |
| POST | /members | Create member |
| PUT | /members/:id | Update member |
| DELETE | /members/:id | Delete member |
| GET | /rotations | List rotations |
| POST | /rotations | Create rotation |
| PUT | /rotations/:id | Update rotation |
| DELETE | /rotations/:id | Delete rotation |
| POST | /rotations/:id/members | Add member to rotation |
| DELETE | /rotations/:id/members/:memberId | Remove member |
| PUT | /rotations/:id/members/reorder | Reorder members (DnD) |
| POST | /rotations/:id/members/swap | Swap two members |
| POST | /rotations/:id/recalculate | Regenerate events |
| GET | /events | List events (filter by rotation_id, from, to) |
| PUT | /events/:id | Manually edit event |
| GET | /gmail/status | Gmail connection status |
| GET | /gmail/auth-url | Get OAuth2 login URL |
| GET | /gmail/callback | OAuth2 callback |
| POST | /gmail/revoke | Disconnect Gmail |
| PUT | /gmail/templates | Update email templates |
| POST | /gmail/send-today | Manually trigger today's emails |
