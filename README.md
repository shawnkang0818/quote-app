# Garage Quote

Full-stack automotive quotation application built with React, Express, and
MongoDB.

## Local setup

1. Copy `server/.env.example` to `server/.env` and fill in the MongoDB and
   administrator credentials.
2. Start the API from `server` with `npm start`.
3. Start the React app from `client` with `npm run dev`.

The API defaults to `http://localhost:5001` and the frontend defaults to
`http://localhost:5173`.

## Environment variables

Keep production credentials in the hosting provider's secret/environment
settings. Never commit `server/.env` or any real database credentials.

- `MONGO_URI`: MongoDB Atlas connection string
- `ADMIN_PASSWORD`: current administrator password
- `PORT`: API port; defaults to `5001` locally
- `CLIENT_ORIGINS`: comma-separated frontend URLs allowed by CORS
- `VITE_API_URL`: public API base URL used by the production frontend

Use `server/.env.example` as the safe template for local and hosted settings.

## Health check

`GET /api/health` reports whether the API process can reach MongoDB. A healthy
deployment returns HTTP `200` with `{"status":"ok","database":"connected"}`;
an unavailable database returns HTTP `503`. This endpoint is intended for
Fly.io health checks and deployment troubleshooting.

## Checks

- Frontend: `npm test`, `npm run lint`, and `npm run build`
- Backend: `npm test`

After upgrading an existing database to the itemized labor and tax model, run
`npm run migrate:quotes` once from the `server` directory.
