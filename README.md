# Rotation Calendar

A full-stack web app for managing member rotation schedules with automatic Gmail notifications.

## Features

- **Calendar view** — monthly/weekly FullCalendar view of all rotation events; click any event to manually reassign the member
- **Rotation management** — create daily or weekly rotations, drag-and-drop to reorder members, recalculate events on demand
- **Members** — manage members (name + email), inline editing, search
- **Gmail integration** — connect a Gmail account via OAuth2; emails are sent automatically at 7 AM on the day of each event
- **Customizable templates** — configure subject/body email templates with `{name}`, `{email}`, `{date}` variables

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

## Dev workflow
1. git checkout main
2. docker compose -f docker-compose.dev.yml up
3. git commit {new_changes}
4. git checkout deploy
5. git merge main
6. Local build
7. git commit {new_build}

## Local build
```
cd /mnt/SSD2/CodeHub/LSEGMail

# Build backend
cd backend && npm ci && npm run build && cd ..

# Build frontend
cd frontend && npm ci && VITE_API_BASE_URL=/api VITE_DEV_MODE= npm run build && cd ..
```

