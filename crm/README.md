# Team CRM

A shared, spreadsheet-style client table: log in, edit cells in place, changes save automatically and appear live for everyone.
React + Vite + TypeScript · Supabase (Postgres, Auth, Realtime) · Netlify (hosting + two small functions for inviting/removing users).

```
src/lib/columns.ts        <- the column list (change columns here)
src/components/Grid.tsx   <- the table (TanStack Virtual keeps thousands of rows smooth)
src/hooks/useClients.ts   <- load / autosave / live updates
src/pages/                <- Login, Clients, Admin (Team), SetPassword
supabase/schema.sql       <- the database (run once in Supabase)
netlify/functions/        <- invite-user, remove-user (use the secret key; run on the server only)
```

## 1. Set up Supabase (once)

1. Create a project at <https://supabase.com> (pick the region closest to you).
2. **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, press **Run**.
3. **Authentication → Sign In / Providers → Email**: make sure Email is enabled, and **turn OFF "Allow new users to sign up"**. (Important: otherwise anyone who finds the login page could create an account. Admins invite people instead.)
4. **Authentication → Users → Add user → Create new user**: enter *your* email + a password and tick **Auto Confirm User**. The first user automatically becomes the admin.
5. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key.

## 2. Run it on your computer (PowerShell)

```powershell
cd crm
npm install
Copy-Item .env.example .env
code .env        # paste the three values, save
npm run dev      # opens http://localhost:5173
```

The invite/remove buttons on the *Team* page need the server functions. To test them locally run this instead of `npm run dev`:

```powershell
npx netlify-cli dev
```

`.env` is ignored by git. Never put the `service_role` key in a variable that starts with `VITE_`.

## 3. Deploy on Netlify

1. Push this repo to GitHub.
2. Netlify → **Add new site → Import an existing project** → choose the repo.
3. **Base directory:** `crm` (leave it empty only if the CRM is the whole repo). Build command and publish folder are read from `netlify.toml` (`npm run build`, `dist`).
4. **Site configuration → Environment variables**, add:
   | Name | Value | Notes |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Project URL | |
   | `VITE_SUPABASE_ANON_KEY` | anon public key | |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key | tick **Contains secret values** |
5. Deploy. Copy your site address (e.g. `https://your-crm.netlify.app`).
6. Back in Supabase → **Authentication → URL Configuration**: set **Site URL** to that address and add `https://your-crm.netlify.app/**` and `http://localhost:5173/**` under **Redirect URLs**. Invite and password-reset emails need this.

Supabase's built-in email sender is limited to a few emails per hour. For regular use add your own SMTP (Authentication → SMTP Settings).

## Adding and removing users

Sign in as an admin → **Team** page.
- **Invite:** type name + email → *Send invite*. They receive an email, click the link and choose a password.
- **Remove:** *Remove* next to their name. Access ends immediately; their clients stay (Owner becomes empty).
- **Make someone admin:** change the *Role* dropdown. Everyone can edit the table; only admins see the Team page.
- Forgot password: *Forgot password?* on the login page.

## Adding a new column (example: "Contract end date")

1. Supabase → SQL Editor:
   ```sql
   alter table public.clients add column contract_end date;
   ```
   Use `text`, `date`, `numeric` or `uuid` as the type.
2. Add one line to `src/lib/columns.ts`, in the position you want it:
   ```ts
   { key: 'contract_end', label: 'Contract end', type: 'date', width: 140, aliases: ['contract end'] },
   ```
   Types: `text`, `email`, `phone`, `date`, `number`, `notes` (popup), `select` (needs `options: [...]`), `owner`.
3. Save. Import, export, search and sorting pick it up automatically.

To **hide** a column, delete its line (the data stays in the database). To change the **status list**, edit `STATUS_OPTIONS` in the same file (and the colours at the bottom of `src/styles.css`); rows that already have an old status keep showing it.

## Using it

- Click a cell, type, press **Enter** (or click away). **Tab** jumps to the next cell, **Esc** cancels. Status and Owner are dropdowns; Notes opens a popup.
- Click a column heading to sort (click again for descending, a third time to clear).
- Rows with a follow-up date of today (yellow) or earlier (red) are highlighted, except Won/Lost deals. Change this in `CLOSED_STATUSES`.
- **Import:** *Import* → pick the file → check the column matching → *Import*. Rows are added, nothing is overwritten. Text dates are read as day/month/year. If a CSV shows garbled Arabic, save it from Excel as **CSV UTF-8** or import the .xlsx.
- **Export:** *Export* downloads the rows currently shown (after search/filters/sorting) as .xlsx.
