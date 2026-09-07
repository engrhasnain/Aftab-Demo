import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDownRight, Ban, HandCoins, Truck, Wallet } from '../components/icons'
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
import { canReversePurchase, getPurchase, productName, productUnit, supplierName } from '../utils/selectors'
import { formatDate, formatMoney, formatNumber, TODAY } from '../utils/format'

export default function PurchaseDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [asking, setAsking] = useState(null)

  const purchase = getPurchase(data, id)
  if (!purchase) {
    return <RecordNotFound title="Purchase" backTo="/purchases" backLabel="Back to purchases" />
  }

  const supplier = supplierName(data, purchase.supplierId)
  const cancelled = purchase.status === 'reversed'
  const cashEntries = data.cashEntries.filter(
    (entry) => entry.referenceType === 'purchase' && entry.referenceId === purchase.id,
  )
  const totalUnits = purchase.items.reduce((total, item) => total + item.qty, 0)
  const reversible = canReversePurchase(data, purchase)

  function confirmSettle() {
    setAsking(null)
    data.settlePurchase(purchase.id, TODAY)
    showToast('Payment recorded', {
      message: `${formatMoney(purchase.totalAmount)} paid to ${supplier} and added to the cash ledger.`,
    })
  }

  function confirmReverse() {
    setAsking(null)
    data.reversePurchase(purchase.id, TODAY)
    showToast('Purchase cancelled', {
      message: `${formatNumber(totalUnits)} units taken back out of stock${
        purchase.paymentStatus === 'paid' ? ' and the money put back in the ledger.' : '.'
      }`,
    })
  }

  return (
    <>
      <PageHeader
        title={`Purchase from ${supplier}`}
        subtitle={`Recorded on ${formatDate(purchase.purchaseDate)}`}
        back={{ to: '/purchases', label: 'Back to purchases' }}
        action={
          cancelled ? null : (
            <>
              <LinkButton to={`/print/purchase/${purchase.id}`} variant="secondary">
                Print voucher
              </LinkButton>
              {purchase.paymentStatus !== 'paid' ? (
                <Button icon={HandCoins} onClick={() => setAsking('settle')}>
                  Record payment
                </Button>
              ) : null}
              <Button variant="secondary" icon={Ban} onClick={() => setAsking('reverse')}>
                Cancel this purchase
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
              <p className="text-lg font-bold text-slate-900">This purchase was cancelled</p>
              <p className="text-base text-slate-700">
                Cancelled on {formatDate(purchase.reversedOn)}. The stock was taken back out
                {purchase.paymentStatus === 'paid' ? ' and the money was returned to the ledger' : ''}. It is kept
                here so the history stays complete.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Purchase summary" />
            <CardBody>
              <DetailList>
                <DetailItem label="Supplier">
                  <Link
                    to={`/suppliers/${purchase.supplierId}`}
                    className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline"
                  >
                    <Truck size={20} aria-hidden="true" />
                    {supplier}
                  </Link>
                </DetailItem>
                <DetailItem label="Purchase date">{formatDate(purchase.purchaseDate)}</DetailItem>
                <DetailItem label="Different products">{purchase.items.length}</DetailItem>
                <DetailItem label="Total units">{formatNumber(totalUnits)}</DetailItem>
                <DetailItem label="Payment status">
                  {cancelled ? (
                    <Badge tone="slate">Cancelled</Badge>
                  ) : (
                    <Badge tone={purchase.paymentStatus === 'paid' ? 'green' : 'amber'}>
                      {purchase.paymentStatus === 'paid' ? 'Paid' : 'Unpaid — on credit'}
                    </Badge>
                  )}
                  {purchase.settledOn ? (
                    <span className="ml-2 text-base text-slate-600">paid on {formatDate(purchase.settledOn)}</span>
                  ) : null}
                </DetailItem>
                <DetailItem label="Total amount">{formatMoney(purchase.totalAmount)}</DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What this changed" />
            <CardBody className="space-y-4">
              <p className="text-base text-slate-700">
                {cancelled ? 'This purchase put ' : 'Recording this purchase added '}
                <span className="font-bold">{formatNumber(totalUnits)} units</span> into stock across{' '}
                {purchase.items.length} batch{purchase.items.length === 1 ? '' : 'es'}
                {cancelled ? ', and cancelling it took them back out.' : '.'}
              </p>

              {cashEntries.length ? (
                cashEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    to="/cash"
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                      entry.direction === 'out'
                        ? 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <ArrowDownRight
                      size={22}
                      className={`shrink-0 ${entry.direction === 'out' ? 'text-red-700' : 'rotate-180 text-emerald-700'}`}
                      aria-hidden="true"
                    />
                    <span>
                      <span
                        className={`block text-base font-bold ${
                          entry.direction === 'out' ? 'text-red-800' : 'text-emerald-800'
                        }`}
                      >
                        {entry.direction === 'out' ? 'Money paid' : 'Money returned'}: {formatMoney(entry.amount)}
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
                    No money has left the account for this purchase yet — it is on credit.
                  </span>
                </div>
              )}

              {!cancelled && !reversible.ok ? (
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
                  {reversible.reason}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Line items" subtitle="Everything that came in with this purchase." />
          <DataTable
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (row) => <span className="font-semibold text-slate-900">{productName(data, row.productId)}</span>,
              },
              { key: 'batch', header: 'Batch number', render: (row) => row.batchNumber },
              { key: 'expiry', header: 'Expiry date', render: (row) => <ExpiryBadge date={row.expiryDate} /> },
              {
                key: 'qty',
                header: 'Quantity',
                align: 'right',
                render: (row) => (
                  <span className="tabular-nums">
                    {formatNumber(row.qty)}{' '}
                    <span className="text-slate-500">{productUnit(data, row.productId)}s</span>
                  </span>
                ),
              },
              {
                key: 'cost',
                header: 'Unit cost',
                align: 'right',
                render: (row) => <span className="tabular-nums">{formatMoney(row.unitCost)}</span>,
              },
              {
                key: 'line',
                header: 'Line total',
                align: 'right',
                render: (row) => <span className="font-bold tabular-nums">{formatMoney(row.qty * row.unitCost)}</span>,
              },
            ]}
            rows={purchase.items}
            rowKey={(row, index) => `${row.productId}-${row.batchNumber}-${index}`}
            onRowClick={(row) => navigate(`/products/${row.productId}`)}
            footer={
              <tr className="border-t-2 border-slate-300 bg-slate-50 text-lg">
                <td className="px-5 py-4 font-bold text-slate-900" colSpan={5}>
                  Total
                </td>
                <td className="px-5 py-4 text-right font-extrabold tabular-nums text-slate-900">
                  {formatMoney(purchase.totalAmount)}
                </td>
                <td />
              </tr>
            }
          />
        </Card>
      </PageBody>

      <ConfirmDialog
        open={asking === 'settle'}
        title="Record this payment?"
        message="This marks the purchase as paid and adds a cash-out line to the ledger."
        detail={
          <span>
            Paying <span className="font-bold">{supplier}</span>
            <br />
            Amount: <span className="font-bold">{formatMoney(purchase.totalAmount)}</span>
          </span>
        }
        confirmLabel="Yes, record the payment"
        cancelLabel="No, go back"
        onConfirm={confirmSettle}
        onCancel={() => setAsking(null)}
      />

      <ConfirmDialog
        open={asking === 'reverse'}
        title={reversible.ok ? 'Cancel this purchase?' : 'This purchase cannot be cancelled'}
        message={
          reversible.ok
            ? 'The stock will be taken back out and, if it was paid for, the money will be put back. The purchase stays in the list marked as cancelled.'
            : reversible.reason
        }
        detail={
          reversible.ok ? (
            <span>
              Taking back <span className="font-bold">{formatNumber(totalUnits)} units</span> across{' '}
              {purchase.items.length} batch{purchase.items.length === 1 ? '' : 'es'}
              {purchase.paymentStatus === 'paid' ? (
                <>
                  <br />
                  Returning <span className="font-bold">{formatMoney(purchase.totalAmount)}</span> to the ledger
                </>
              ) : null}
            </span>
          ) : null
        }
        confirmLabel={reversible.ok ? 'Yes, cancel this purchase' : 'I understand'}
        cancelLabel={reversible.ok ? 'No, keep it' : 'Close'}
        onConfirm={reversible.ok ? confirmReverse : () => setAsking(null)}
        onCancel={() => setAsking(null)}
      />
    </>
  )
}
