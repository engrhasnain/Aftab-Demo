import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, Ban, HandCoins, Store, Wallet } from '../components/icons'
import { LinkButton } from '../components/ui/Button'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ExpiryBadge from '../components/ui/ExpiryBadge'
import { DetailItem, DetailList } from '../components/ui/DetailList'
import RecordNotFound from '../components/ui/RecordNotFound'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { customerName, getBatch, getCustomer, getSale, licenceStatus, productName, productUnit } from '../utils/selectors'
import { formatDate, formatMoney, formatNumber, TODAY } from '../utils/format'

export default function SaleDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [asking, setAsking] = useState(null)

  const sale = getSale(data, id)
  if (!sale) {
    return <RecordNotFound title="Sale" backTo="/sales" backLabel="Back to sales" />
  }

  const customer = customerName(data, sale.customerId)
  const buyer = getCustomer(data, sale.customerId)
  const licence = buyer ? licenceStatus(buyer) : null
  const cancelled = sale.status === 'reversed'
  const cashEntries = data.cashEntries.filter(
    (entry) => entry.referenceType === 'sale' && entry.referenceId === sale.id,
  )
  const totalUnits = sale.items.reduce((total, item) => total + item.qty, 0)

  function confirmSettle() {
    setAsking(null)
    data.settleSale(sale.id, TODAY)
    showToast('Payment received', {
      message: `${formatMoney(sale.totalAmount)} received from ${customer} and added to the cash ledger.`,
    })
  }

  function confirmReverse() {
    setAsking(null)
    data.reverseSale(sale.id, TODAY)
    showToast('Sale cancelled', {
      message: `${formatNumber(totalUnits)} units put back into stock${
        sale.paymentStatus === 'paid' ? ' and the money returned in the ledger.' : '.'
      }`,
    })
  }

  return (
    <>
      <PageHeader
        title={`Sale to ${customer}`}
        subtitle={`Recorded on ${formatDate(sale.saleDate)}`}
        back={{ to: '/sales', label: 'Back to sales' }}
        action={
          cancelled ? null : (
            <>
              <LinkButton to={`/print/invoice/${sale.id}`} variant="secondary">
                Print invoice
              </LinkButton>
              <LinkButton to={`/print/challan/${sale.id}`} variant="secondary">
                Print challan
              </LinkButton>
              {sale.paymentStatus !== 'paid' ? (
                <Button icon={HandCoins} onClick={() => setAsking('settle')}>
                  Record payment
                </Button>
              ) : null}
              <Button variant="secondary" icon={Ban} onClick={() => setAsking('reverse')}>
                Cancel this sale
              </Button>
            </>
          )
        }
      />

      <PageBody>
        {cancelled ? (
          <div className="flex items-start gap-3 rounded-2xl border-2 border-slate-300 bg-slate-100 px-5 py-4">
            <Ban size={24} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold text-slate-900">This sale was cancelled</p>
              <p className="text-base text-slate-700">
                Cancelled on {formatDate(sale.reversedOn)}. The stock went back on the shelf
                {sale.paymentStatus === 'paid' ? ' and the money was returned in the ledger' : ''}. It is kept here so
                the history stays complete.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Sale summary" />
            <CardBody>
              <DetailList>
                <DetailItem label="Customer">
                  <Link
                    to={`/customers/${sale.customerId}`}
                    className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline"
                  >
                    <Store size={20} aria-hidden="true" />
                    {customer}
                  </Link>
                </DetailItem>
                <DetailItem label="Billed to" wide>
                  <span className="block">{buyer ? buyer.businessTitle || buyer.name : customer}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-base font-normal text-slate-600">
                    <Badge tone={buyer && buyer.taxStatus === 'filer' ? 'green' : 'slate'}>
                      {buyer && buyer.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}
                    </Badge>
                    {buyer && buyer.ntn ? <span>NTN {buyer.ntn}</span> : null}
                    {buyer && buyer.licenceNumber ? (
                      <>
                        <span>Licence {buyer.licenceNumber}</span>
                        {licence && licence.state !== 'none' ? (
                          <Badge tone={licence.tone}>{licence.label}</Badge>
                        ) : null}
                      </>
                    ) : null}
                  </span>
                </DetailItem>
                <DetailItem label="Sale date">{formatDate(sale.saleDate)}</DetailItem>
                <DetailItem label="Lines">{sale.items.length}</DetailItem>
                <DetailItem label="Total units">{formatNumber(totalUnits)}</DetailItem>
                <DetailItem label="Payment status">
                  {cancelled ? (
                    <Badge tone="slate">Cancelled</Badge>
                  ) : (
                    <Badge tone={sale.paymentStatus === 'paid' ? 'green' : 'amber'}>
                      {sale.paymentStatus === 'paid' ? 'Paid' : 'Unpaid — on credit'}
                    </Badge>
                  )}
                  {sale.settledOn ? (
                    <span className="ml-2 text-base text-slate-600">received on {formatDate(sale.settledOn)}</span>
                  ) : null}
                </DetailItem>
                <DetailItem label="Total amount">{formatMoney(sale.totalAmount)}</DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What this changed" />
            <CardBody className="space-y-4">
              <p className="text-base text-slate-700">
                {cancelled ? 'This sale took ' : 'Recording this sale took '}
                <span className="font-bold">{formatNumber(totalUnits)} units</span> out of stock across{' '}
                {sale.items.length} batch{sale.items.length === 1 ? '' : 'es'}
                {cancelled ? ', and cancelling it put them back.' : '.'}
              </p>

              {cashEntries.length ? (
                cashEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    to="/cash"
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                      entry.direction === 'in'
                        ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100'
                        : 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                    }`}
                  >
                    <ArrowUpRight
                      size={22}
                      className={`shrink-0 ${entry.direction === 'in' ? 'text-emerald-700' : 'rotate-180 text-red-700'}`}
                      aria-hidden="true"
                    />
                    <span>
                      <span
                        className={`block text-base font-bold ${
                          entry.direction === 'in' ? 'text-emerald-800' : 'text-red-800'
                        }`}
                      >
                        {entry.direction === 'in' ? 'Money received' : 'Money returned'}: {formatMoney(entry.amount)}
                      </span>
                      <span className="block text-sm text-slate-600">
                        {formatDate(entry.entryDate)} · see it in the cash ledger
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
                  <Wallet size={22} className="shrink-0 text-amber-700" aria-hidden="true" />
                  <span className="text-base font-semibold text-amber-900">
                    No money has come in for this sale yet — it is on credit.
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Line items"
            subtitle="Everything that went out with this sale, and the batch it came from."
          />
          <DataTable
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (row) => <span className="font-semibold text-slate-900">{productName(data, row.productId)}</span>,
              },
              {
                key: 'batch',
                header: 'Batch number',
                render: (row) => {
                  const batch = getBatch(data, row.stockBatchId)
                  return batch ? batch.batchNumber : '—'
                },
              },
              {
                key: 'expiry',
                header: 'Expiry date',
                render: (row) => {
                  const batch = getBatch(data, row.stockBatchId)
                  return batch ? <ExpiryBadge date={batch.expiryDate} /> : '—'
                },
              },
              {
                key: 'qty',
                header: 'Quantity',
                align: 'right',
                render: (row) => (
                  <span className="tabular-nums">
                    {formatNumber(row.qty)}{' '}
                    <span className="text-slate-500">{productUnit(data, row.productId)}s</span>
                    {row.bonusQty ? (
                      <span className="mt-0.5 block text-sm font-semibold text-emerald-700">
                        + {formatNumber(row.bonusQty)} free
                      </span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: 'price',
                header: 'Unit price',
                align: 'right',
                render: (row) => <span className="tabular-nums">{formatMoney(row.unitPrice)}</span>,
              },
              {
                key: 'tax',
                header: 'Sales tax',
                align: 'right',
                render: (row) =>
                  row.taxAmount ? (
                    <span className="tabular-nums">
                      {formatMoney(row.taxAmount)}
                      <span className="block text-sm text-slate-500">at {row.taxPercent}%</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">No tax</span>
                  ),
              },
              {
                key: 'line',
                header: 'Line total',
                align: 'right',
                render: (row) => (
                  <span className="font-bold tabular-nums">
                    {formatMoney(row.lineTotal !== undefined ? row.lineTotal : row.qty * row.unitPrice)}
                  </span>
                ),
              },
            ]}
            rows={sale.items}
            rowKey={(row, index) => `${row.productId}-${row.stockBatchId}-${index}`}
            onRowClick={(row) => navigate(`/products/${row.productId}`)}
            footer={
              <>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="px-5 py-2.5 font-semibold text-slate-700" colSpan={6}>
                    Goods value
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                    {formatMoney(sale.subtotal ?? sale.totalAmount)}
                  </td>
                  <td />
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-5 py-2.5 font-semibold text-slate-700" colSpan={6}>
                    Sales tax
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                    {formatMoney(sale.taxTotal ?? 0)}
                  </td>
                  <td />
                </tr>
                {sale.furtherTax ? (
                  <tr className="bg-slate-50">
                    <td className="px-5 py-2.5 font-semibold text-slate-700" colSpan={6}>
                      Further tax at {sale.furtherTaxPercent}% — buyer is a non-filer
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                      {formatMoney(sale.furtherTax)}
                    </td>
                    <td />
                  </tr>
                ) : null}
                <tr className="border-t border-slate-300 bg-slate-50 text-lg">
                  <td className="px-5 py-4 font-bold text-slate-900" colSpan={6}>
                    {data.settings.taxMode === 'inclusive-mrp'
                      ? 'Customer pays (tax included above)'
                      : 'Customer pays'}
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold tabular-nums text-slate-900">
                    {formatMoney(sale.totalAmount)}
                  </td>
                  <td />
                </tr>
              </>
            }
          />
        </Card>
      </PageBody>

      <ConfirmDialog
        open={asking === 'settle'}
        title="Record this payment?"
        message="This marks the sale as paid and adds a cash-in line to the ledger."
        detail={
          <span>
            Received from <span className="font-bold">{customer}</span>
            <br />
            Amount: <span className="font-bold">{formatMoney(sale.totalAmount)}</span>
          </span>
        }
        confirmLabel="Yes, record the payment"
        cancelLabel="No, go back"
        onConfirm={confirmSettle}
        onCancel={() => setAsking(null)}
      />

      <ConfirmDialog
        open={asking === 'reverse'}
        title="Cancel this sale?"
        message="The stock will go back on the shelf and, if it was paid for, the money will be returned. The sale stays in the list marked as cancelled."
        detail={
          <span>
            Putting back <span className="font-bold">{formatNumber(totalUnits)} units</span>
            {sale.paymentStatus === 'paid' ? (
              <>
                <br />
                Returning <span className="font-bold">{formatMoney(sale.totalAmount)}</span> in the ledger
              </>
            ) : null}
          </span>
        }
        confirmLabel="Yes, cancel this sale"
        cancelLabel="No, keep it"
        onConfirm={confirmReverse}
        onCancel={() => setAsking(null)}
      />
    </>
  )
}
