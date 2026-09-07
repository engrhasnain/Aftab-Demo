import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import {
  customerName,
  employeeName,
  getBatch,
  getCustomer,
  getProduct,
  getPurchase,
  getSale,
  getSupplier,
  licenceStatus,
  productName,
} from '../utils/selectors'
import { formatDate, formatMoney, formatNumber } from '../utils/format'
import logoMark from '../assets/raso-logo.png'

/**
 * The paper.
 *
 * A distribution business cannot run on screens alone — the driver carries a
 * delivery challan, the shop signs it, and the accountant files the invoice.
 * This renders those documents on their own, with no sidebar and no colour, so
 * what comes out of the printer is what a business would actually issue.
 *
 * Everything here reads from the stored document, never recalculated, so a
 * reprint years later shows exactly what was charged on the day.
 */

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function under100(n) {
  if (n < 20) return ONES[n]
  return (TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')).trim()
}

function under1000(n) {
  if (n < 100) return under100(n)
  return (ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + under100(n % 100) : '')).trim()
}

/** Rupees in words, grouped the South Asian way — crore, lakh, thousand. */
export function amountInWords(amount) {
  const whole = Math.floor(Math.abs(Number(amount) || 0))
  const paisa = Math.round((Math.abs(Number(amount) || 0) - whole) * 100)
  if (whole === 0 && paisa === 0) return 'Zero rupees only'

  const parts = []
  const crore = Math.floor(whole / 10000000)
  const lakh = Math.floor((whole % 10000000) / 100000)
  const thousand = Math.floor((whole % 100000) / 1000)
  const rest = whole % 1000

  if (crore) parts.push(under1000(crore) + ' crore')
  if (lakh) parts.push(under1000(lakh) + ' lakh')
  if (thousand) parts.push(under1000(thousand) + ' thousand')
  if (rest) parts.push(under1000(rest))

  let words = parts.join(' ').trim() || 'zero'
  words = words.charAt(0).toUpperCase() + words.slice(1)
  return paisa ? `${words} rupees and ${under100(paisa)} paisa only` : `${words} rupees only`
}

const DOC_TITLES = {
  invoice: 'SALES INVOICE',
  challan: 'DELIVERY CHALLAN',
  purchase: 'PURCHASE VOUCHER',
  'sale-return': 'SALES RETURN NOTE',
  'purchase-return': 'PURCHASE RETURN NOTE',
}

export default function PrintDoc() {
  const { kind, id } = useParams()
  const [params] = useSearchParams()
  const data = useData()
  const copies = params.get('copies') || 'Original'

  const sale = kind === 'invoice' || kind === 'challan' ? getSale(data, id) : null
  const purchase = kind === 'purchase' ? getPurchase(data, id) : null
  const saleReturn = kind === 'sale-return' ? data.salesReturns.find((r) => r.id === id) : null
  const purchaseReturn = kind === 'purchase-return' ? data.purchaseReturns.find((r) => r.id === id) : null
  const doc = sale || purchase || saleReturn || purchaseReturn

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl p-10">
        <p className="text-lg font-semibold text-slate-900">That document could not be found.</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 underline">
          Back to the system
        </Link>
      </div>
    )
  }

  const isSaleSide = Boolean(sale || saleReturn)
  const partyId = sale ? sale.customerId : saleReturn ? saleReturn.customerId : purchase ? purchase.supplierId : purchaseReturn.supplierId
  const party = isSaleSide ? getCustomer(data, partyId) : getSupplier(data, partyId)
  const licence = isSaleSide && party ? licenceStatus(party) : null
  const showMoney = kind !== 'challan'
  const docDate = sale ? sale.saleDate : purchase ? purchase.purchaseDate : doc.date
  const docNo = doc.code ? String(doc.code) : doc.id.toUpperCase()

  const items = doc.items || []

  return (
    <div className="print-root min-h-screen bg-slate-200 py-8 print:bg-white print:py-0">
      {/* Screen-only controls */}
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-4 px-4">
        <Link to={isSaleSide ? `/sales/${sale ? sale.id : saleReturn.saleId}` : `/purchases/${purchase ? purchase.id : purchaseReturn.purchaseId}`} className="text-lg font-semibold text-brand-700 underline">
          ← Back
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border-2 border-brand-600 bg-brand-600 px-6 py-3 text-lg font-bold text-white hover:bg-brand-700"
        >
          Print this page
        </button>
      </div>

      <article className="sheet mx-auto max-w-[210mm] bg-white p-[14mm] text-slate-900 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        {/* ---------- letterhead ---------- */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-4">
          <div className="flex items-start gap-4">
            <img src={logoMark} alt="" className="h-14 w-auto" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{data.settings.businessName}</h1>
              <p className="text-sm text-slate-600">Distributors of baby food, nutrition and medicines</p>
              <p className="text-sm text-slate-600">Korangi Industrial Area, Karachi · 021-3506-8842</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-extrabold tracking-wide">{DOC_TITLES[kind] || 'DOCUMENT'}</h2>
            <p className="mt-1 text-sm">
              No. <span className="font-bold tabular-nums">{docNo}</span>
            </p>
            <p className="text-sm">
              Date <span className="font-bold">{formatDate(docDate)}</span>
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">{copies} copy</p>
          </div>
        </header>

        {/* ---------- party ---------- */}
        <section className="grid grid-cols-2 gap-6 border-b border-slate-300 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {isSaleSide ? 'Billed to' : 'Supplier'}
            </p>
            <p className="mt-1 text-lg font-bold">{party ? party.businessTitle || party.name : '—'}</p>
            <p className="text-sm text-slate-700">{party ? party.longAddress : ''}</p>
            <p className="text-sm text-slate-700">{party ? party.contactNumber : ''}</p>
          </div>
          <div className="text-right text-sm">
            {isSaleSide && party ? (
              <>
                <p>
                  <span className="text-slate-500">Tax status: </span>
                  <span className="font-bold">{party.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}</span>
                </p>
                {party.ntn ? (
                  <p>
                    <span className="text-slate-500">NTN: </span>
                    <span className="font-bold tabular-nums">{party.ntn}</span>
                  </p>
                ) : null}
                {party.licenceNumber ? (
                  <p>
                    <span className="text-slate-500">Drug licence: </span>
                    <span className="font-bold">{party.licenceNumber}</span>
                    {party.licenceExpiry ? (
                      <span className="text-slate-600"> (valid to {formatDate(party.licenceExpiry)})</span>
                    ) : null}
                  </p>
                ) : null}
                {licence && licence.state === 'expired' ? (
                  <p className="mt-1 font-bold text-red-700">LICENCE EXPIRED</p>
                ) : null}
              </>
            ) : null}
            <p className="mt-2">
              <span className="text-slate-500">Customer code: </span>
              <span className="font-bold tabular-nums">{party ? party.code : '—'}</span>
            </p>
          </div>
        </section>

        {/* ---------- lines ---------- */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left">
              <th className="py-2 pr-2 font-bold">#</th>
              <th className="py-2 pr-2 font-bold">Product</th>
              <th className="py-2 pr-2 font-bold">Batch</th>
              <th className="py-2 pr-2 font-bold">Expiry</th>
              <th className="py-2 pr-2 text-right font-bold">Qty</th>
              {isSaleSide && kind !== 'sale-return' ? (
                <th className="py-2 pr-2 text-right font-bold">Free</th>
              ) : null}
              {showMoney ? <th className="py-2 pr-2 text-right font-bold">Rate</th> : null}
              {showMoney ? <th className="py-2 pr-2 text-right font-bold">Tax</th> : null}
              {showMoney ? <th className="py-2 text-right font-bold">Amount</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const product = getProduct(data, item.productId)
              const batch = item.stockBatchId ? getBatch(data, item.stockBatchId) : null
              const batchNo = item.batchNumber || (batch ? batch.batchNumber : '—')
              const expiry = item.expiryDate || (batch ? batch.expiryDate : null)
              const rate = item.unitPrice !== undefined ? item.unitPrice : item.unitCost
              return (
                <tr key={index} className="border-b border-slate-200 align-top">
                  <td className="py-2 pr-2 tabular-nums">{index + 1}</td>
                  <td className="py-2 pr-2">
                    <span className="font-semibold">{productName(data, item.productId)}</span>
                    {product && product.controlled ? (
                      <span className="ml-2 rounded border border-red-500 px-1 text-xs font-bold text-red-700">
                        CONTROLLED
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2">{batchNo}</td>
                  <td className="py-2 pr-2">{expiry ? formatDate(expiry) : '—'}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {formatNumber(item.qty)} {product ? product.unit : ''}
                  </td>
                  {isSaleSide && kind !== 'sale-return' ? (
                    <td className="py-2 pr-2 text-right tabular-nums">{item.bonusQty ? item.bonusQty : '—'}</td>
                  ) : null}
                  {showMoney ? <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(rate)}</td> : null}
                  {showMoney ? (
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {item.taxAmount ? formatMoney(item.taxAmount) : '—'}
                    </td>
                  ) : null}
                  {showMoney ? (
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {formatMoney(item.lineTotal !== undefined ? item.lineTotal : item.qty * rate)}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ---------- totals ---------- */}
        {showMoney ? (
          <section className="mt-4 flex justify-end">
            <table className="w-[80mm] text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-600">Goods value</td>
                  <td className="py-1 text-right font-semibold tabular-nums">
                    {formatMoney(doc.subtotal ?? doc.totalAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Sales tax</td>
                  <td className="py-1 text-right font-semibold tabular-nums">{formatMoney(doc.taxTotal ?? 0)}</td>
                </tr>
                {doc.furtherTax ? (
                  <tr>
                    <td className="py-1 text-slate-600">Further tax ({doc.furtherTaxPercent}%)</td>
                    <td className="py-1 text-right font-semibold tabular-nums">{formatMoney(doc.furtherTax)}</td>
                  </tr>
                ) : null}
                <tr className="border-t-2 border-slate-800">
                  <td className="py-2 text-base font-bold">Total</td>
                  <td className="py-2 text-right text-base font-extrabold tabular-nums">
                    {formatMoney(doc.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {showMoney ? (
          <p className="mt-3 border-t border-slate-300 pt-2 text-sm">
            <span className="text-slate-500">Amount in words: </span>
            <span className="font-semibold">{amountInWords(doc.totalAmount)}</span>
          </p>
        ) : (
          <p className="mt-4 border-t border-slate-300 pt-2 text-sm text-slate-600">
            This is a delivery document only. It carries no prices and is not a demand for payment.
          </p>
        )}

        {doc.reason ? (
          <p className="mt-2 text-sm">
            <span className="text-slate-500">Reason for return: </span>
            <span className="font-semibold">{doc.reason}</span>
          </p>
        ) : null}

        {/* ---------- signatures ----------
            Where the system knows who did the work, the name is printed under
            the line. A challan that carries the driver's name is what settles
            an argument about a delivery that supposedly never arrived. */}
        <footer className="mt-12 grid grid-cols-3 gap-8 text-sm">
          {[
            { role: 'Prepared by', name: sale && sale.bookedBy ? employeeName(data, sale.bookedBy) : null },
            { role: 'Delivered by', name: sale && sale.deliveredBy ? employeeName(data, sale.deliveredBy) : null },
            { role: isSaleSide ? 'Received by (customer stamp)' : 'Authorised by', name: null },
          ].map((slot) => (
            <div key={slot.role}>
              <div className="h-12 border-b border-slate-500" />
              <p className="mt-1 text-slate-600">{slot.role}</p>
              {slot.name ? <p className="font-semibold text-slate-900">{slot.name}</p> : null}
            </div>
          ))}
        </footer>

        <p className="mt-6 border-t border-slate-300 pt-2 text-center text-xs text-slate-500">
          Goods once sold are returnable only under the agreed terms and with this document. ·{' '}
          {data.settings.businessName}
        </p>
      </article>
    </div>
  )
}
