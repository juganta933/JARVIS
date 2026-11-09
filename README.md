# JARVIS

caredentials  -> appId=todo  password=joiaiaxom

A lightweight Next.js dashboard for application metrics, service activity, and recent telemetry events.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend URL is configured once through the environment and is not editable in the UI.

## Configuration

Copy `.env.example` to `.env.local` and set the fixed backend URL and optional non-secret App ID:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_DEFAULT_APP_ID=
```

The App ID setting is optional. Sign-in is verified by the backend `/auth/login` endpoint, so configure the application credentials in the backend and enter the password in the sign-in form. Do not put passwords or other secrets in `NEXT_PUBLIC_*` variables; Next.js exposes those values to browser code. Changing the backend URL requires updating the environment and restarting/rebuilding the app.

The dashboard reads `/dashboard/metrics`, `/dashboard/services`, and `/dashboard/events/recent`. Data refreshes every three seconds while the dashboard is open.
