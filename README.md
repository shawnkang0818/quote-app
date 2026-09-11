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

## Checks

- Frontend: `npm test`, `npm run lint`, and `npm run build`
- Backend: `npm test`

After upgrading an existing database to the itemized labor and tax model, run
`npm run migrate:quotes` once from the `server` directory.
