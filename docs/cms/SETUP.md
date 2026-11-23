# CMS setup — connecting Supabase

The dashboard lives at **`/admin`**. Content is stored in Supabase (Postgres + Auth + Storage). Until Supabase is connected, the website shows the content bundled in `content/` and `config/site.ts`.

## How it is secured

- The website and the dashboard use **only the publishable key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). It is safe in the browser: Row Level Security (RLS) in the database decides what it can do. The **service-role / secret key is not used anywhere** — do not add it.
- Visitors can only read published content (`cms_snapshot`). Drafts, the activity log and the list of administrators are not readable without signing in.
- Dashboard access = a valid Supabase Auth session **and** a row in `public.admins`. Every page and every Server Action checks both on the server; RLS checks them again in the database. Hiding a button is never the only protection.
- There is **no public sign-up**. Accounts are created in the Supabase dashboard; an owner then grants them access under **Users**.
- Roles: **owner** (everything, including managing administrators) and **editor** (all content). The database always keeps at least one owner.
- The dashboard is `noindex`, cannot be framed, and every change is recorded in the activity log by database triggers.

## One-time setup

### 1. Create the project
[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**. Choose a region close to Egypt (e.g. Frankfurt `eu-central-1`) and a strong database password (keep it in a password manager — it is only needed for step 4).

### 2. Authentication settings
**Authentication → Sign In / Providers**
- Turn **off** “Allow new users to sign up”.
- Keep **Email** enabled.

**Authentication → URL Configuration**
- **Site URL**: the production address, e.g. `https://www.drmohamedgamal.com` (or the Vercel address until the domain is connected).
- **Redirect URLs**: add
  - `https://<production-domain>/admin/auth/confirm`
  - `https://<vercel-project>.vercel.app/admin/auth/confirm`
  - `http://localhost:3000/admin/auth/confirm` (development)

### 3. Create your administrator account
**Authentication → Users → Add user → Create new user**: your email, a password you choose, and tick **Auto Confirm User**. (You type the password yourself; it is never shared with anyone.)

### 4. Create the tables, import the content, make yourself owner
Get the connection string: **Connect** (top bar) → **Session pooler** → copy the URI. Use the pooler, not the direct connection — the direct one is IPv6-only and unreachable from most networks. Leave the password out of the URI and give it separately (single quotes keep characters such as `#` intact). Then, on your computer, in this project folder:

```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres.<project-ref>@aws-0-<region>.pooler.supabase.com:5432/postgres"
$env:PGPASSWORD = '<database password>'
npm run db:setup -- --owner you@example.com
Remove-Item Env:SUPABASE_DB_URL, Env:PGPASSWORD
```

This applies `supabase/migrations/` (tables, RLS, functions, storage buckets and policies), imports the current website content from `supabase/seed/content.sql` (never overwriting rows that already exist), and grants you the owner role. It is safe to run again. The connection string stays on your computer — never put it in Vercel or in a file that is committed.

### 5. Environment variables
**Project Settings → API**: copy the **Project URL** and the **Publishable key** (`sb_publishable_…`; the legacy `anon` key also works).

- Local: create `.env.local` (see `.env.example`):
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  NEXT_PUBLIC_SITE_URL=https://www.drmohamedgamal.com
  ```
- Vercel: **Project → Settings → Environment Variables** — the same three variables (Production and Preview), then **Redeploy**.

### 6. Check
```powershell
npm run cms:verify
```
It confirms, as a visitor would see it, that the content is readable, drafts / activity / administrators are not, writes are refused, the storage buckets exist and public sign-ups are off.

Then open `/admin`, sign in, and publish a small change to confirm the website updates.

### 7. Upload size (videos)
The `videos` bucket accepts files up to 500 MB, but Supabase also has a **project-wide** limit: **Storage → Settings → Upload file size limit** (50 MB on the Free plan). Raise it on a paid plan if you will upload long videos — or keep videos on YouTube, which the video manager supports directly.

## Adding another administrator
1. Supabase → **Authentication → Users → Add user → Create new user** (with *Auto Confirm User*) — or **Send invitation** (see *Email links* below).
2. Dashboard → **Users → Grant access**: the same email and a role.

Removing access (Users → delete) keeps the Supabase account but closes the dashboard to it immediately.

## Email links (password reset, invitations)
“Forgot password?” on the sign-in page works with Supabase’s default email templates. For **invitations** sent from the Supabase dashboard, change the template so the link is handled on the server: **Authentication → Emails → Invite user** →

```html
<a href="{{ .SiteURL }}/admin/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept the invitation</a>
```

The invited person then chooses a password on **My account**. For production, set up custom SMTP (**Authentication → Emails → SMTP Settings**); Supabase’s built-in sender is rate-limited.

## Working with content
- **Sections** (Website pages, Global CTA, Footer, Navigation bar button): edits are saved as **drafts**; visitors keep seeing the published version until you **Publish**. **Preview** opens the website with your drafts (only for signed-in administrators). Sections can be hidden and reordered.
- **Items** (services, videos, articles, FAQs …): each has a status — *Draft* (not on the website) or *Published*. Saving a published item updates the website immediately; *Unpublish* hides it.
- **Translations**: every text has an Arabic and an English field side by side. An empty field shows the other language on the website, and the dashboard flags texts that are filled in one language only.
- **Media**: images, videos and PDFs go to Supabase Storage. Replacing a file updates it everywhere; a file that is still used cannot be deleted.

## Development without Supabase
```powershell
$env:CMS_LOCAL = "1"; npm run dev
```
The dashboard then uses a local database in `.cms-local/` (real migrations, seed and RLS; uploads go to `public/uploads/`). Sign in with “Continue as the local administrator”. Delete `.cms-local/` to start again from the seed. This mode never runs in production and switches off automatically once the Supabase variables are set.

## Regenerating the seed
After changing `content/` or `config/site.ts` (before launch):
```powershell
npm run cms:seed-sql
```
