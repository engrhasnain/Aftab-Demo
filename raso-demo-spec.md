# Raso management system — clickable UI demo (build spec)

## 1. What this is

A **frontend-only, click-through demo** of a management system for Raso Pakistan, an FMCG distribution company (baby cereal, infant formula, date syrup, apple cider vinegar). The demo is for showing the client what the finished app will look and feel like. It is not the real product.

**This is not a prototype to harden later — it is a disposable demo.** Optimize for looking and feeling real in a client meeting, not for code that survives into production.

## 2. Hard scope boundary — read this first

- **No backend. No database. No API calls. No network requests of any kind.**
- All data is defined in one static JavaScript/TypeScript file and loaded into memory when the app starts.
- All "saving" (adding a purchase, recording a sale, adding a supplier, etc.) only updates in-memory state via React state/Context. Nothing persists.
- **Refreshing the browser resets everything back to the seed data.** This is expected and correct behavior — do not implement localStorage, sessionStorage, IndexedDB, or any persistence layer.
- No authentication, no login screen, no user accounts, no permissions/roles.
- No real currency conversion, no real tax calculation logic beyond simple multiplication — everything here is for visual demonstration only.
- If a feature described below would normally require a backend (e.g. "search across all historical sales"), implement it by filtering the in-memory dummy data instead — never stub an API call.

If anything in this document seems to imply backend work, that is a mistake in the document, not a hint to add one. Flag it and default to frontend-only.

## 3. Tech stack

- React 18 (function components + hooks only, no class components)
- Vite as the build tool
- Tailwind CSS for styling
- React Router for navigation between screens (all client-side, no real routes to fetch)
- State: React Context + `useState`/`useReducer`. No Redux, no Zustand, no external state library — the data is small enough that Context is sufficient.
- No TypeScript required, but fine to use if it speeds you up. Plain JS is acceptable.
- No component library (no MUI, no Ant Design, no shadcn). Build components from scratch with Tailwind so the visual style is fully controlled and consistent. Icons: use `lucide-react` (lightweight, no styling conflicts).

## 4. Who this is for — design mandate

The end users of the real app are **not comfortable with software**. This is the single most important design constraint and should override any instinct toward a "dense, powerful" business-software layout. Concretely:

- Big, obvious buttons with text labels, not icon-only buttons.
- One clear primary action per screen (usually a prominent "+ Add" or "+ Record" button, top-right).
- Forms are simple, vertical, single-column. No multi-column dense forms.
- Every form field has a visible label above it, not just a placeholder.
- Confirmations after every action: after adding/saving something, show a brief success message (e.g. a toast or inline banner) before returning to the list. Never silently update — the user should always get visible feedback that their click did something.
- Avoid jargon in labels. Use "Money we received" / "Money we paid" as sub-labels alongside "Cash in" / "Cash out" if helpful.
- Generous spacing, large readable text (base font size 16px, not 14px), high contrast.
- No hover-only interactions (e.g. no "hover to reveal delete button") since this may be used on touch devices — actions should always be visible.
- Empty states matter: if a list is genuinely empty, show a friendly message and a clear call-to-action, not a blank table.

## 5. Global layout

- Left sidebar (collapsible on smaller screens), always visible on desktop, containing:
  - Raso logo/name at top
  - Nav links, each with an icon + label: Dashboard, Suppliers, Products, Customers, Purchases, Sales, Stock, Cash ledger, Employees
  - Active page is visually highlighted
- Top bar: page title + the page's primary action button (e.g. "+ Add supplier")
- Main content area: the screen itself
- Keep the same shell across all screens — only the main content area changes.

## 6. Dummy data model

Create one file, e.g. `src/data/seedData.js`, exporting the following. Populate each with **realistic-looking sample rows** (8–15 rows per list is enough — enough to show scrolling/pagination behavior, not so much it's unwieldy in a demo). Use product names and categories consistent with Raso's real business (baby cereal, infant formula, date syrup, apple cider vinegar) so the demo feels tailored, not generic.

```
Supplier
  id, name, longAddress, shortAddress, contactNumber

Customer
  id, name, longAddress, shortAddress, contactNumber

ProductGroup
  id, name, supplierId

Product
  id, name, groupId, supplierId, mrp, tp, dp, salesTaxPercent

StockBatch
  id, productId, batchNumber, expiryDate, qtyOnHand

Purchase
  id, supplierId, purchaseDate, items: [{ productId, batchNumber, expiryDate, qty, unitCost }], totalAmount, paymentStatus ("paid" | "unpaid" — paid is the default/expected case per the client's notes, but include the field since it may be needed later)

Sale
  id, customerId, saleDate, items: [{ productId, stockBatchId, qty, unitPrice }], totalAmount, paymentStatus

Employee
  id, name, designation, monthlySalary

CashEntry
  id, entryDate, direction ("in" | "out"), amount, referenceType ("purchase" | "sale" | "salary"), referenceId, note
```

Seed the data so it is **internally consistent**: stock batch quantities should roughly reflect purchases minus sales already recorded, and cash entries should already exist for the seeded purchases/sales/salary payments so the Cash ledger and Dashboard show believable non-zero numbers on first load.

## 7. Screens

For every screen below: build the list/table view first, then the "add new" form, then wire the form to actually update the shared in-memory data so the list reflects it immediately without a refresh.

### 7.1 Dashboard (landing screen)

Purpose: a glance-able summary, not a data-entry screen.

- 4 summary cards across the top: Total products, Total stock value (sum of qty × DP across all batches), Cash in hand (net from Cash ledger), Products expiring soon (count of batches expiring within 30 days of "today" — pick a fixed reference date in the seed data, e.g. treat the seed data as "as of" a specific date, so this number is stable and not dependent on the real current date)
- A simple bar or line chart: "Sales in the last 7 days" (dummy daily totals) — use a lightweight charting lib like `recharts`
- A short "Recent activity" list: last 5–8 entries combining recent purchases, sales, and cash entries, newest first, each row clickable through to its detail

### 7.2 Suppliers

- Table: Name, Short address, Contact number, and a count of products supplied. Clicking a row opens a detail view showing full info + long address + a list of products from that supplier + a list of recent purchases from that supplier.
- "+ Add supplier" button opens a form (name, long address, short address, contact number). On submit, adds to the in-memory list and returns to the table with the new row visible and a success confirmation.
- Basic search/filter by name above the table.

### 7.3 Customers

- Same structure as Suppliers (table, detail view, add form, search) but detail view shows recent sales to that customer instead of products.

### 7.4 Products

- Table: Name, Group, Supplier, MRP, TP, DP, current total stock (sum across batches). Filter/search by name, and a dropdown filter by Group and by Supplier.
- Clicking a row opens a detail view: full pricing (MRP/TP/DP/sales tax), which supplier and group it belongs to, and a table of its stock batches (batch #, expiry, qty).
- "+ Add product" form: name, group (dropdown — reuse existing groups or allow creating a new one inline), supplier (dropdown), MRP, TP, DP, sales tax %.
- Visually flag batches expiring soon (e.g. an amber/red badge) wherever batch/expiry appears in this screen.

### 7.5 Purchases

- Table of past purchases: date, supplier, item count, total amount, payment status. Clicking a row shows the full purchase detail (line items: product, batch #, expiry, qty, unit cost).
- "+ Record purchase" — this is the most important interactive flow in the demo, build it carefully:
  1. Select a supplier (dropdown/searchable select)
  2. Add one or more line items: select product (dropdown, filtered to that supplier's products if reasonable), enter quantity, batch number, expiry date, unit cost. Support adding multiple line items to one purchase (an "+ Add another item" button within the form).
  3. Show a running total as items are added.
  4. On submit: create the Purchase record, create/update the corresponding StockBatch entries (increase qty), and create a matching CashEntry (direction "out", referenceType "purchase"). All in memory.
  5. Show a success confirmation, then return to the purchases table with the new purchase visible at the top.
  6. This demonstrates to the client that recording a purchase automatically updates stock and cash — call this out with a small inline note in the UI near the submit button, e.g. "This will update stock and cash automatically."

### 7.6 Sales

- Same shape as Purchases, mirrored for the sales side:
  1. Select a customer.
  2. Add line items: select product, then the system should show available batches for that product (batch #, expiry, qty available) and let the user pick one or auto-select the nearest-expiry batch — pick whichever is simpler to build well, and note the choice in a one-line code comment. Enter quantity (validate it doesn't exceed available qty in the selected batch — show an inline error if it does, don't allow submit).
  3. Enter unit price (default it to the product's DP or MRP, editable).
  4. Running total as items are added.
  5. On submit: create the Sale record, decrease the relevant StockBatch qty, create a matching CashEntry (direction "in", referenceType "sale"). All in memory.
  6. Same success confirmation + return-to-table behavior as Purchases.

### 7.7 Stock

- A single table, the "live inventory" view: Product, Group, Batch #, Expiry date, Qty on hand. Sortable by expiry date (soonest first, as the default sort). Color-code rows/badges by urgency (e.g. expiring within 30 days = amber, within 7 days = red, otherwise normal).
- Search/filter by product name.
- This screen is read-only (no add/edit) — stock only changes as a side effect of Purchases and Sales, which should already be reflected here live since it's reading the same in-memory data.

### 7.8 Cash ledger

- A running list of all CashEntry records, newest first: date, direction (in/out, visually distinct — e.g. green for in, red for out), amount, reference (e.g. "Sale to Al-Barkat Traders" / "Purchase from XYZ Distributors" / "Salary — Ahmed Khan"), clicking through to the underlying purchase/sale/employee where relevant.
- A running balance shown either as a running total column or a prominent summary number at the top (net cash position = sum of all "in" minus sum of all "out").
- Filter by direction (all / in / out) and by a simple date range if time allows — not essential for the demo, skip if it adds complexity without much payoff.

### 7.9 Employees

- Table: Name, Designation, Monthly salary. "+ Add employee" form (same fields).
- A simple "Record salary payment" action per employee row (or a dedicated button) that creates a CashEntry (direction "out", referenceType "salary") for that employee's monthly salary amount, and shows a confirmation. This is the simplest of the transactional flows — keep it to one click plus a confirm step, no multi-line-item form needed here.

## 8. Interaction quality bar

Every button in the app must do something visible when clicked. Concretely, before considering the demo done, verify:

- Every "+ Add ___" button opens a working form, and submitting it visibly changes a list somewhere.
- Every table row that's described as clickable actually navigates to a detail view.
- Every form has basic validation (required fields can't be submitted empty; numeric fields reject non-numeric input) with inline error messages — since these are meant to look and feel real, not just be visually present.
- Every action that's supposed to trigger a side effect (a Sale reducing stock, a Purchase increasing stock, either creating a Cash entry) actually does so in the shared state, and that update is visible immediately on the relevant other screen without a refresh.
- No dead links, no buttons that are visually present but wired to nothing.

## 9. What NOT to build

To keep this focused and avoid scope creep in either direction:

- No backend, database, or API layer of any kind (restating from section 2 — this is the most important constraint in this document).
- No login/auth/user roles.
- No mobile app — responsive web is enough, optimize for desktop/laptop screen sizes first since that's the primary use case, but don't break completely on a tablet-sized screen.
- No PDF/print/export functionality.
- No settings/configuration screens.
- No real data import (the "Import Info" / call-products-to-sheet workflow from the client's notes) — that's a real feature for the production build, not for this click-through demo. Skip it entirely.
- No multi-currency, multi-warehouse, or multi-branch support — single location, single currency (PKR) assumed throughout.

## 10. Deliverable

A single React app, runnable with `npm install && npm run dev`, that a non-technical person can click through end-to-end — add a supplier, add a product, record a purchase, record a sale, and see the Stock, Cash ledger, and Dashboard screens all reflect those actions — without ever hitting a real backend.
