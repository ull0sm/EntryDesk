# ⚙️ Quick Setup & Local Development

Getting EntryDesk running locally on your machine is straightforward.

## 1. Prerequisites
- **Node.js** (v20+ recommended)
- **Supabase** (A free tier project works perfectly. Create one at [supabase.com](https://supabase.com))

## 2. Install Dependencies
Clone the repository and install the NPM packages:
```bash
npm install
```

## 3. Environment Variables
Copy the template file to create your local environment configuration:
```bash
cp .env.example .env.local
```
Fill in the required values from your Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Cloudflare Turnstile site key used by login and signup)
- `NEXT_PUBLIC_BASE_URL` (Defaults to `http://localhost:3000` for local dev)

## 4. Database Schema Setup
This repository includes the necessary schema, RLS policies, and views.

1. Go to your Supabase Dashboard → **SQL Editor**
2. Paste the contents of `supabase/migrations/db.sql` and run it.

*This will generate the required tables (`profiles`, `dojos`, `students`, `events`, etc.), enums, RLS policies, and the `organizer_entries_view`.*

## 5. Authentication Configuration
**Email/Password** requires Supabase CAPTCHA protection to be enabled when Turnstile is configured in this app. Users must also verify their email before they can access the dashboard.

**Cloudflare Turnstile for Email Login and Signup**:
1. Create a Turnstile widget in Cloudflare and copy the site key and secret key.
2. Add the site key to your local environment as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. In Supabase Dashboard, go to **Authentication** → **Bot and Abuse Protection**.
4. Enable CAPTCHA protection, choose **Cloudflare Turnstile**, and paste the Turnstile secret key.
5. Save the settings before testing login or signup.

**Google OAuth (Optional)**:
1. Navigate to Supabase Dashboard → **Authentication** → **Providers** → **Google**.
2. Enable Google and input your OAuth client credentials.
3. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

## 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 👥 Roles & Workflows

### The Profiles Table
Supabase Auth manages users in `auth.users`, while our application's role and profile data lives in `public.profiles`. Profiles are often auto-created during key flows, such as signing up or applying to an event.

### Making an Organizer
To access organizer features, a user must have a row in `public.profiles` with `role = 'organizer'`. You can set this explicitly via the Supabase SQL editor:
```sql
UPDATE public.profiles SET role = 'organizer' WHERE email = 'organizer@example.com';
```