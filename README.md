# PCU One Stop Centre – Dashboard (BM / EN)

Working system: React + Vite frontend, Supabase (Postgres + Auth + RLS) backend.
Staff login, live dashboard with filters (totals only; DASS, Tatatertib and Intervensi records also keep name, matric/staff no. and officer, visible to approved staff only),
data-entry forms, Excel/CSV import with undo, CSV export, admin page.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local`, fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql` once in the Supabase SQL editor (both the main block and the v2 block; already applied to the project created for you)
4. `npm run dev`

Try without a backend: `npm run build:demo` (or `VITE_MOCK=1 npm run dev`). Login `demo@pcu.test` / `demo1234`. Data stays in the browser only.

## Deploy
`npm run build` then upload the `dist/` folder to any static host (Hostinger, Netlify, Vercel).
Set the two `VITE_` variables at build time. Uses hash routing, so no server rewrites needed.

## Accounts and access
- The **first person to sign up becomes admin**. Do this yourself right after deploying.
- Later sign-ups are **pending** until an admin approves them (Admin page).
- Supabase Auth settings: either turn off "Confirm email" or set up SMTP; once staff exist, consider disabling public sign-ups.
- Roles: admin (users, lookup lists, delete any record) and staff (view, add, import, delete own records).

## Importing data
Import page: pick a module, download the template, fill it, upload `.csv` or `.xlsx`. Rows are validated first; each import is a batch that can be undone. Demo rows are labelled "DATA CONTOH (demo)".

## Notes
- PTJ, department, case-type lists etc. are placeholders; edit them in Admin.
- DASS-21 levels use the standard x2 cut-offs and are computed by the database.
