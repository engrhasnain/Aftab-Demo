# Raso management system — screen-by-screen walkthrough

A guide for whoever is presenting the demo. Every screen, every card, every
button: what it is, and a suggested line to say.

Nothing here is a guess — it matches the app exactly as built.

---

## Before you start

Two sentences to open with, so nothing surprises anyone later:

> "This is a working demo of the screens. It runs entirely on this laptop —
> there is no server behind it yet, so if I refresh the page everything I add
> goes back to the starting data. That is deliberate."

> "All the figures are shown 'as of 15 June 2025'. We fixed the date so the
> screens look the same every time we show them, instead of changing with
> today's date."

---

## The frame around every screen

These pieces are on every page, so explain them once at the start and you never
have to explain them again.

| Piece | What it is | What to say |
|---|---|---|
| **Left sidebar** | The eleven screens of the system | "Everything in the system is one of these eleven screens." |
| **Fold button** (top of the sidebar) | Shrinks the sidebar to a strip of icons, click again to open it | "On a small laptop you can fold this away to get more room. Hover any icon and its name appears." |
| **Solid vs outline icons** | The page you are on has a filled-in icon; the rest are outlines | "You can always see which page you are on." |
| **Gold dot** | Marks the current page | — |
| **Page title + description** | Top-left of every screen | — |
| **Search box** (top bar) | Searches customers, suppliers, products, batch numbers and staff all at once | "You don't need to know which screen a thing lives on. Type a shop name, a phone number, or a batch code printed on a carton, and it finds it." |
| **Blue button, top-right** | The one main action for that screen | "There is only ever one main button per screen, so nobody has to hunt." |
| **Green message, top-right** | Confirmation after every action | "Nothing ever happens silently. Every time you save something, it tells you exactly what changed." |
| **"Just added" green tag** | Marks the row you just created | "After you add something, it shows you where it landed." |

### Colour code — the same everywhere

| Colour | Meaning |
|---|---|
| **Green** | Money coming in, or "paid" |
| **Red** | Money going out, expired, or already overdue |
| **Amber / orange** | Needs attention soon — expiring within 30 days, unpaid |
| **Grey with a line through it** | Cancelled — kept for the record, not counted in any total |

---

## 1. Dashboard

*"The morning screen. The owner opens this and knows where the business stands."*

### The six cards across the top

Each one is clickable and takes you to the screen behind it.

| Card | What it shows | What to say |
|---|---|---|
| **Total products** | How many items are on the price list | "15 products across 9 groups." |
| **Stock we can sell** | Value of the stock on the shelves, at distributor price | "What is sitting in the warehouse in rupees. **Expired stock is not counted here** — if something has gone bad, it is worth nothing and we say so." |
| **Cash in hand** | Money received minus money paid | "Every rupee in minus every rupee out." |
| **Customers owe us** | Sales delivered on credit, not yet paid | "Money out in the market that hasn't come back yet." |
| **We owe suppliers** | Stock taken on credit, not yet settled | "What we owe the companies we buy from." |
| **Expiring soon** | Batches with 30 days or less left | "Anything that will go bad within a month. Click it to see exactly what." |

**The orange line down the left edge of a card** means that card needs
attention. *"Colour is never decoration here — a card only goes orange when
there is something to do."*

### Sales in the last 7 days

A bar per day for the last week, with the week's total in the heading. Hover any
bar to see that day's exact figure.

> "At a glance: is this week better or worse than last week."

### Recent activity

The last eight things that happened — purchases, sales and salary payments,
newest first. Green with an up-arrow is money in, red with a down-arrow is money
out. Every row is clickable and opens the actual record.

> "The owner can see what his staff have been recording, and click straight into
> anything that looks wrong."

### Batches to use up first

Only appears when something is expiring. Amber boxes showing the product, batch
number, quantity and expiry date. Click one to open the product.

> "This is the money-saving screen. Sell these first or send them back before
> they expire."

---

## 2. Suppliers

*"The companies we buy from."*

### The list

Columns: **Name · Short address · Contact number · Products supplied**

- **Search box** — searches name, area **and** phone number. *"If you only
  remember they're in Karachi, type Karachi."*
- **+ Add supplier** (top right)
- Click any row to open that supplier.

### Supplier detail

| Card | What it holds |
|---|---|
| **Contact information** | Name, full address, short address, phone |
| **Summary** | Products supplied · Purchases recorded · Total bought |
| **Products from this supplier** | Product, Group, DP, In stock — click any to open it |
| **Recent purchases from this supplier** | Date, Items, Total amount, Payment status |

Buttons: **Edit details** and **Record purchase**.

> "Everything about one supplier on one page — who they are, what they sell us,
> and what we have bought from them."

### Add / Edit supplier

A simple single-column form: Name, Full address, Short address, Contact number.
Fields marked `*` are required.

> "Notice every box has its label written above it, not hidden inside. And if
> you get something wrong, it tells you at the top of the form and jumps you to
> the box that needs fixing."

---

## 3. Products

*"Everything we buy and sell, with prices."*

### The list

Columns: **Name · Group · Supplier · MRP · TP · DP · In stock**

- **MRP** = printed retail price · **TP** = trade price to shops · **DP** =
  distributor price. This is spelled out under the table too.
- **Search by name**, plus **Filter by group** and **Filter by supplier**
  dropdowns, and a **Clear filters** button once a filter is on.
- The stock column shows the unit — *"80 packs, not just 80"*.
- An amber **"2 expiring"** tag appears next to stock if any batch is near expiry.

### Product detail

| Card | What it holds |
|---|---|
| **Pricing** | MRP, TP, DP (each labelled "per pack" / "per tin"), Sales tax %, and **Sold as** — e.g. "1 tin · 12 tins per carton" |
| **Where it comes from** | Supplier (clickable), Group, and total in stock with its value |
| **Stock batches** | Batch number, Expiry date, Quantity on hand, Value at DP — soonest expiry first, amber and red rows highlighted, expired shown as **"Counted as nil"** |
| **Recent movement** | Date, What happened, Batch, Change (+ or −) |

> "**Recent movement** answers the question every owner asks: *why* is the stock
> 35? You can see every purchase, sale and write-off that touched it."

### Add / Edit product

Product name, Supplier, Group (with **+ Create a new group** built into the
dropdown), Unit, Units per carton, MRP, TP, DP, Sales tax %.

> "You don't have to go somewhere else to make a new group — you type it right
> here."

---

## 4. Customers

*"The shops and stores we sell to."*

Same shape as Suppliers.

### The list
Columns: **Name · Short address · Contact number · Sales · Total sold**

### Customer detail
- **Contact information**
- **Summary** — Sales recorded · Total sold · Last sale
- **Recent sales to this customer** — Date, Items, Total amount, Payment

Buttons: **Edit details**, **Record sale**.

---

## 5. Purchases — stock coming in

*"Everything we have bought from suppliers."*

### The list
Columns: **Date · Supplier · Items · Total amount · Payment**

Search by supplier. Cancelled purchases stay in the list, greyed out with a line
through the date and a **Cancelled** tag — and they are **not** counted in the
total underneath.

### Record purchase — three clear steps

**Step 1 — Who did you buy from?**
- **Supplier** — a searchable dropdown. *"Type two letters instead of scrolling."*
- **Purchase date**
- **Have you paid for this purchase?** — "Yes, paid in full (money out)" or
  "Not yet, on credit (no money out)". *"If it's on credit, no money moves, and
  it appears under Money owed until you settle it."*

**Step 2 — What did you buy?** Each item has:
- **Product** — only this supplier's products, searchable
- **Quantity** — with a helper line: *"That is 5 cartons of 24"*
- **Unit cost** — pre-filled with what you paid last time
- **Batch number** — suggests existing batches, and tells you plainly whether
  you are **adding to an existing batch** or **opening a new one**. If you
  mistype, it warns: *"Did you mean BCW-2506?"*
- **Expiry date** — with **+6 months / +1 year / +2 years** buttons
- **Line total** updates as you type
- **+ Add another item** for more products on the same bill

> "This batch warning is worth showing off. A typo like a space instead of a dash
> would quietly split your stock into two batches. The system catches it."

**Step 3 — Check and save**
- Blue panel with the **running total**, item count and unit count
- The note: **"This will update stock and cash automatically."**
- **Save purchase**

> "One entry. Stock goes up, money goes out, and the cash book is written — the
> user doesn't do three jobs."

### Purchase detail

| Card | What it holds |
|---|---|
| **Purchase summary** | Supplier, date, different products, total units, payment status, total |
| **What this changed** | In plain words: how many units went into stock, and the money paid — clickable to the cash ledger |
| **Line items** | Product, Batch number, Expiry, Quantity, Unit cost, Line total, with a Total row |

Buttons:
- **Record payment** — only when unpaid. Asks to confirm, then marks it paid and
  writes the cash-out line.
- **Cancel this purchase** — takes the stock back out and returns the money.
  **If the stock has already been sold on, the system refuses** and tells you
  which batch and how many are missing.

> "Nothing is ever deleted. A cancelled purchase stays in the list marked
> cancelled, so the history still reads correctly for the accountant."

---

## 6. Sales — stock going out

### The list
Columns: **Date · Customer · Items · Total amount · Payment**. Same cancelled
behaviour as purchases.

### Record sale — the flow to demonstrate

**Step 1 — Who did you sell to?** Customer (searchable), Sale date, and
**Has the customer paid?**

**Step 2 — What did you sell?**
- **Product** — the dropdown shows the honest number: *"125 bottles in stock
  across 3 batches"*
- **Quantity**
- **Unit price** — starts at the distributor price, editable

Then the panel that is worth demonstrating slowly:

> **"Coming out of these batches"** — the system takes stock from the batch
> expiring soonest first, and if you ask for more than one batch holds it
> **splits it across batches automatically** and shows you exactly which ones.

- A link to **"Choose the batch myself"** if they want manual control
- If you ask for more than exists, it says how many short you are

**Step 3 — Check and save** — running total, the same automatic-update note,
**Save sale**.

### Sale detail
Same three cards as a purchase, plus each line shows **which batch it came from
and that batch's expiry** — the traceability a food business needs.

Buttons: **Record payment** (if unpaid) and **Cancel this sale** — puts the
stock back and returns the money.

---

## 7. Stock

*"The live picture of the warehouse. Read-only — it changes by itself."*

### Four cards
**Batches on hand · Stock we can sell · Expired stock · Expiring within 30 days**

> "**Stock we can sell** deliberately does not include expired stock. **Expired
> stock** is shown separately so the loss is visible instead of hidden inside a
> good-looking number."

### The table
Columns: **Product · Group · Batch number · Expiry date · Qty on hand · Value at
DP · Action**

- **Product, Expiry date and Qty are sortable** — click the heading. Default is
  soonest expiry first.
- **Amber rows** expire within 30 days, **red rows** within 7 days or already
  expired. Expired rows show **"Counted as nil"** instead of a value.
- **Search** covers product name **and** batch number.

### Write off
A button on every row with stock. Asks how many and why — **Expired, Damaged,
Lost or stolen, Counting correction, Returned to supplier**.

> "This removes the stock and records the reason. It does **not** touch cash,
> because losing goods is not the same as paying money."

---

## 8. Cash ledger

*"The cash book. Every rupee in and out."*

### Three cards
- **Cash in hand** (the big one) — money received minus money paid
- **Total cash in** — green
- **Total cash out** — red

### Filters
- Three buttons: **Everything · Cash in — money we received · Cash out — money we paid**
- **From date** and **To date** (optional)
- **Clear filters** appears once a filter is on, with a running count

### The table
**Date · In or out · Reference · Amount · Balance after**

- Green "Cash in" and red "Cash out" tags with arrows
- **Reference** says what it was: *"Sale to Al-Barkat Traders"*, *"Salary — Ahmed Khan"*
- **Balance after** — the running balance at that point
- Click any row to open the purchase, sale or employee behind it

> "Nobody types in this screen. Every line is written automatically by a
> purchase, a sale or a salary payment."

---

## 9. Money owed

*"The question every distributor asks each morning."*

### Three cards
- **Customers owe us** — green, with how many sales
- **We owe suppliers** — red, with how many purchases
- **Difference** — what we are owed minus what we owe

### Two tables
**Money customers owe us** and **Money we owe suppliers**, both oldest first.

Columns: **Customer/Supplier · Sold on/Bought on · Waiting · Amount · Action**

- **Waiting** is a coloured tag: grey under 14 days, amber over 14, red over 30
- **Record money in / Record money out** settles the bill in one click plus a
  confirm, and writes the cash entry

> "Oldest at the top, because those are the ones to chase first."

---

## 10. Reports

*"Pick any period and see how the business did."*

### Which period?
Buttons: **This month · Last month · This quarter · Last quarter · This year ·
Choose my own dates**. The last one reveals From and To boxes.

### "In plain words" — read this one out loud

The first thing on the page is not a chart. It is the answer in sentences:

> *"You sold **Rs 11,51,640** worth of goods in 8 sales to 7 customers. After
> what that stock cost you, you kept **Rs 2,93,690** — about **26 paisa of every
> rupee**. Rs 10,87,920 came in and Rs 1,90,000 went out, so your cash went **up
> by Rs 8,97,920** over these 15 days. That is **up 223%** on the 15 days
> before. Your best day was 12 Jun with Rs 2,28,375."*

> "This is the part for the owner who does not read charts. He reads two
> sentences and he knows."

### Four numbers
**You sold · That stock cost · You kept · Cash moved**

> "**You kept** is worked out properly — the system knows what each batch
> actually cost when it was bought, so this is a real margin, not a guess."

### Two charts
- **How much you sold** — a bar per day (or per month for longer periods)
- **Money coming in and going out** — blue bars against orange bars.
  *"Taller blue than orange means you took in more than you paid out."*

Both have a **Show the numbers** button that reveals a plain table underneath.

> "For anyone who would rather see figures than a picture, the table is one
> click away."

### Three ranked lists
**Your best-selling products · Your biggest customers · Which kinds of product
sold most**

Each is a bar with the **rupee value printed on it** and its share of the total.
Products and customers are clickable.

> "Nobody has to measure a bar against a ruler — the number is written on it."

### What you bought in
**Purchases · Salaries paid · Days covered** for the period.

---

## 11. Employees

### Three cards
**Employees · Monthly wage bill · Still to pay for June 2025**

### The table
**Name · Designation · Monthly salary · June 2025 status · Action**

- Status is a green **Paid** tag or an amber **Not paid yet**
- **Record salary payment** — one click plus a confirm, then writes the cash-out
  line
- **Edit** on every row

> "Four of the eight are already paid this month, so you can demonstrate paying
> one of the others live and then show it appearing in the cash ledger."

---

## The five-minute demo route

1. **Dashboard** — the six numbers and the week's chart
2. **Purchases → Record purchase** — supplier, two items, use **+1 year** for
   expiry, show the batch warning, save
3. **Stock** — the batches are already there
4. **Cash ledger** — the money is already recorded, balance has moved
5. **Sales → Record sale** — ask for more than one batch holds, show the
   automatic split
6. **Money owed** — who owes us, settle one
7. **Reports** — This month, read the plain-words paragraph
8. **Dashboard** — every figure has changed

---

## Questions the client will ask

**"Does it work on a phone?"**
It works on a tablet and adjusts down to a phone, but it is built for a laptop
first because that is where the entry happens. A proper phone app for order
bookers in the field is a separate decision.

**"Can two people use it at once?"**
Not in this demo — it runs on one laptop. That is the first thing the real build
adds: a server, logins, and several people working at the same time.

**"Where is my data saved?"**
Nowhere yet. This demo is the screens only. Refresh and it resets. The real
build puts a proper database behind exactly these screens.

**"Can I print an invoice / delivery challan?"**
Not yet — it is on the list for the real build, and it is one of the first
things to add.

**"Does it handle sales tax?"**
Every product records its tax rate, but the totals do not apply it yet. Tax is
worth building carefully rather than quickly, so it is deliberately not in the
demo.

**"What about my discounts and free-goods schemes?"**
Not in the demo. It is a known gap and it matters, because it is how prices
actually work in this trade.

**"Can I record rent, fuel and electricity?"**
Not yet — right now only purchases, sales and salaries move cash. Worth being
straight about this: it also means **"You kept"** on the Reports screen is
profit *before* those costs, not the final profit. It is the first gap to close.

**"Can I fix a mistake?"**
Yes — and show them. Every supplier, customer, product and employee can be
edited, and any purchase or sale can be cancelled, which puts the stock and the
money back. Nothing is ever deleted; a cancelled record stays visible so the
history still reads correctly.
