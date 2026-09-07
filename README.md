# Raso Pakistan — management system demo

A clickable, frontend-only demo of a management system for Raso Pakistan (FMCG
distribution: baby cereal, infant formula, date syrup, apple cider vinegar).

It exists to show the client what the finished product will look and feel like.
It is **not** the real product.

## Running it

```bash
npm install
npm run dev
```

Then open the address Vite prints (it opens your browser automatically).

The sidebar folds down to a rail of icons with the button in its header, and
opens again the same way. On a narrow screen it becomes a drawer behind a
**Menu** button instead.

## Putting it online

The code lives at <https://github.com/engrhasnain/Aftab-Demo> and the demo is
deployed from there through Vercel. Vercel watches the repository, so every push
to `main` rebuilds and republishes the site on its own — there is nothing to
upload by hand.

To set it up the first time:

1. Sign in at <https://vercel.com> with the GitHub account that owns the
   repository.
2. **Add New -> Project**, then import `Aftab-Demo`.
3. Vercel recognises Vite and fills everything in: build command `vite build`,
   output directory `dist`. Leave it as it found it.
4. **Deploy.** It takes about a minute, and the link appears when it finishes.

The link comes out as `https://aftab-demo.vercel.app` (or whatever project name
you accept on the way through). It can be renamed later under
**Settings -> Domains**, and a real domain can be pointed at it there too.

One file matters for this: [vercel.json](vercel.json). There is no file sitting
at `/suppliers` — the app invents that address as you click — so a refresh, or a
link you send someone, would otherwise land on a Vercel 404. The rewrite in that
file hands every unknown address to the app, which then opens the right screen.

Anyone with the link can open it. Each visitor gets their own copy of the demo
data in their own browser; nothing they type is sent anywhere, stored on a
server, or visible to anyone else.

## What to show in a demo

1. **Dashboard** — the six summary cards, the 7-day sales chart, recent activity.
2. **Record a purchase** (Purchases → Record purchase) — pick a supplier by typing
   its name, add two line items, use the **+1 year** button for the expiry, and
   watch the batch field say whether you are adding to a batch or opening a new
   one.
3. **Stock** — the batches you just bought are already there.
4. **Cash ledger** — the money paid is already recorded, and the balance moved.
5. **Record a sale** (Sales → Record sale) — pick a product and ask for more than
   the oldest batch holds. The app splits it across batches for you, oldest
   expiry first, and shows exactly which ones it will use.
6. **Money owed** — who owes us and who we owe, with one button to settle each.
7. **Cancel a sale** (open any sale → Cancel this sale) — the stock goes back and
   the money is returned, and the sale stays in the list marked cancelled.
8. **Reports** — pick This month / Last month / a quarter / your own dates. The
   period is summarised in plain words first, then the charts.
9. **Dashboard again** — every figure has moved.

You can also add and **edit** suppliers, customers, products (including a brand
new product group, created inline) and employees, record a salary payment, and
write off stock that is expired, damaged or lost.

Anywhere in the app, the search box in the top bar looks across customers,
suppliers, products, batch numbers and staff at once.

## How it works

- **No backend, no database, no network calls.** Everything is in memory.
- All data starts from [`src/data/seedData.js`](src/data/seedData.js) and is held
  in a single React reducer at
  [`src/context/DataContext.jsx`](src/context/DataContext.jsx).
- **Refreshing the browser resets everything back to the seed data.** That is
  intentional — there is no persistence layer of any kind.
- The dataset is "as of" a fixed date (15 June 2025) rather than today's date, so
  expiry warnings and the 7-day chart look the same whenever the demo is shown.

## Notable behaviour

- **Mistakes are fixable.** Master records can be edited; purchases and sales are
  never deleted, they are cancelled — the stock and cash are reversed and the
  record stays, marked cancelled, so the history reads correctly.
- **Sales draw from batches oldest-first** and split across as many batches as
  the quantity needs.
- **Expired stock is valued at nothing**, reported separately, and never offered
  for sale.
- **A purchase cannot be cancelled** once its stock has been sold on — the app
  explains why and names the batch.
- Money is shown with South Asian digit grouping (`Rs 9,09,880`) throughout.
- **Reports** cover any period and work out real gross profit, using what each
  batch actually cost, not a guessed margin.
- **Every sale carries the person who booked it and the person who delivered
  it.** That is what makes a salesperson's target measurable, feeds the "who sold
  what" table in Reports, and puts a driver's name on the challan when a customer
  says an order never arrived.
- **Pay is not one button.** A month can be settled in instalments, an advance
  can be handed over early and taken back out of a later payment, and overtime or
  an absence adjusts what is owed. Paying twice, paying more than is owed, or
  recovering an advance that was never given are refused in the store, not just
  hidden on the screen.
- **Somebody who leaves is marked as left, never deleted.** They come off the
  wage bill and out of the sale screen's lists, and every invoice and delivery
  they handled keeps their name.
- All date maths is done in UTC, so a day means the same day in Karachi as
  anywhere else.

## Chart colours

The two-series charts do **not** use green-vs-red. That pair fails colour-blind
separation (ΔE 5.6 deutan, measured — not guessed). Money in / money out uses the
brand navy step `#3B4CA4` against orange `#eb6834`, which clears every check, and
both charts carry a legend and a "Show the numbers" table so identity never rests
on colour alone.

## Icons

Every icon in the app comes from one file,
[`src/components/icons.js`](src/components/icons.js), which maps the app's own
words for things ("Truck", "Wallet", "Warehouse") onto an icon set. Screens
import from there, never from the icon package, so the whole set can be swapped
by editing that single file.

The set is Remix Icon, which ships matching outline and solid weights — the
sidebar uses the solid weight for the page you are on and the outline for the
rest.

## Stack

React 18 · Vite · Tailwind CSS · React Router (data router) · react-icons ·
recharts. No component library, no state library, no TypeScript.
