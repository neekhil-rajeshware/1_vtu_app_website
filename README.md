# OneVTU — website and admin dashboard

The public website for the OneVTU app, plus a private dashboard at `/admin` where
everything on it can be changed without touching code.

- **Public pages:** home, features, screenshots, download, about, contact, report
  content, blog, privacy policy, terms, community guidelines, delete account
- **`/app-ads.txt`** served from the domain root for AdMob
- **Dark and light mode**, following the phone or laptop's own setting
- **No visitor accounts.** There is no sign-up anywhere. The only login is yours.

Built with Next.js 16 (App Router), Tailwind CSS v4, Supabase and Tiptap.
Hosted on Vercel.

## Running it on your own machine

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run build   # what Vercel runs; fails on any TypeScript error
npm run lint    # code style
npm start       # serve the built site
```

## Putting it online (once)

1. **Push this folder to GitHub.** Create an empty repository on github.com —
   don't add a README or a licence — then, in this folder:

   ```bash
   git init
   git add .
   git commit -m "OneVTU website and admin dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Import it into Vercel.** vercel.com → Add New → Project → pick the
   repository. Framework is detected as Next.js; leave every build setting alone.

3. **Add the three environment variables** from `.env.example` under
   Project Settings → Environment Variables, for Production, Preview and
   Development. Then Deploy.

4. **Point your domain at it** (Vercel → Settings → Domains) and set
   `NEXT_PUBLIC_SITE_URL` to that domain. Redeploy once so canonical links,
   the sitemap and `app-ads.txt` all use the real address.

Every `git push` to `main` after that deploys itself. Content changes made in
`/admin` are live immediately — they don't need a deploy, because they live in
the database, not in this code.

## Getting into the dashboard

Sign in at `/admin/login`. There is no sign-up page, and there never will be —
an admin has to be created deliberately in Supabase:

1. Supabase → Authentication → Users → **Add user**, with a real email and a
   password. Tick "Auto Confirm User".
2. Copy that user's UID from the same list.
3. Supabase → Table editor → `web_admins` → **Insert row**, and paste the UID
   into `user_id`. Fill in anything else the form asks for.

   Or, in the SQL editor, with your own email in it:

   ```sql
   insert into public.web_admins (user_id)
   select id from auth.users where email = 'you@example.com'
   on conflict do nothing;
   ```

Being signed in is not enough on its own — the row in `web_admins` is what the
database checks before it lets anything be written. Forgot the password? Use
"Forgot your password?" on the login page.

## How the dashboard is laid out

| Section | What it changes |
| --- | --- |
| Dashboard | A checklist of what still needs doing, and anything waiting in your inbox |
| Site settings | App name, logo, contact email, social links, download details, SEO, footer, about text |
| Home page | The big headline, and the heading above each section (or hide a section) |
| Announcement bar | The thin strip across the top of every page |
| Features, Screenshots, Numbers, Reviews, FAQ, Version history | The lists the public pages are built from |
| Blog posts | Write, save as a draft, publish |
| Messages, Content reports | Everything the public sends you, with a note of what you decided |
| Legal pages | Privacy policy, terms, community guidelines, delete account |
| In-app links | Buttons **inside the phone app** — changing one here needs no app update |
| app-ads.txt | The line AdMob asks you to publish |
| Media library | Every image you've uploaded, with copyable links |
| My account | Change your own password |

## Where things are in the code

```
src/app/(site)/        public pages
src/app/admin/         login page, and (dashboard)/ for everything behind it
src/app/og/            the sharing image, drawn on the fly
src/components/        site sections, and admin/ for the dashboard
src/lib/content.ts     public reads (features, posts, FAQs, …)
src/lib/settings.ts    the web_settings key/value store and its types
src/lib/supabase/      browser, server and proxy clients
src/proxy.ts           keeps the login session fresh (Next 16's middleware)
```

Two rules worth keeping:

- **No service role key anywhere.** Only the publishable key is used, in the
  browser and on the server alike. Row Level Security decides what can be read
  and written, so a leaked key gives away nothing a visitor couldn't already see.
- **Nothing is statically cached.** Pages render per request on purpose, so a
  change made in the dashboard shows up on the next page load instead of after
  the next deploy.


