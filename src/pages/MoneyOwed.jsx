import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, HandCoins, PartyPopper } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button, { LinkButton } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { payables, receivables, sumAmount } from '../utils/selectors'
import { formatDate, formatMoney, TODAY } from '../utils/format'

/**
 * The question a distributor asks every morning: who owes us, and who do we
 * owe. Both sides are just the unpaid purchases and sales, gathered in one
 * place with the button that settles them.
 */
export default function MoneyOwed() {
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [asking, setAsking] = useState(null)

  const owedToUs = receivables(data)
  const weOwe = payables(data)
  const owedToUsTotal = sumAmount(owedToUs)
  const weOweTotal = sumAmount(weOwe)

  function confirmSettle() {
    const row = asking
    setAsking(null)
    if (!row) return

    if (row.kind === 'sale') {
      data.settleSale(row.id, TODAY)
      showToast('Payment received', {
        message: `${formatMoney(row.amount)} received from ${row.partyName} and added to the cash ledger.`,
      })
    } else {
      data.settlePurchase(row.id, TODAY)
      showToast('Payment recorded', {
        message: `${formatMoney(row.amount)} paid to ${row.partyName} and added to the cash ledger.`,
      })
    }
  }

  const columnsFor = (kind) => [
    {
      key: 'party',
      header: kind === 'sale' ? 'Customer' : 'Supplier',
      render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span>,
    },
    {
      key: 'date',
      header: kind === 'sale' ? 'Sold on' : 'Bought on',
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span>,
    },
    {
      key: 'age',
      header: 'Waiting',
      render: (row) => (
        <Badge tone={row.daysOld > 30 ? 'red' : row.daysOld > 14 ? 'amber' : 'slate'}>
          {row.daysOld} day{row.daysOld === 1 ? '' : 's'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums text-slate-900">{formatMoney(row.amount)}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          icon={HandCoins}
          onClick={(event) => {
            event.stopPropagation()
            setAsking(row)
          }}
        >
          {kind === 'sale' ? 'Record money in' : 'Record money out'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Money owed"
        subtitle="What customers still owe us, and what we still owe our suppliers."
        action={
          <LinkButton to="/cash" variant="secondary">
            Open cash ledger
          </LinkButton>
        }
      />

      <PageBody>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ArrowUpRight size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold text-emerald-900">Customers owe us</p>
                <p className="text-sm text-emerald-800">Money we are still waiting for</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-emerald-900">{formatMoney(owedToUsTotal)}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              across {owedToUs.length} sale{owedToUs.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                <ArrowDownRight size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold text-red-900">We owe suppliers</p>
                <p className="text-sm text-red-800">Stock taken on credit</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-red-900">{formatMoney(weOweTotal)}</p>
            <p className="mt-1 text-sm font-semibold text-red-800">
              across {weOwe.length} purchase{weOwe.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Difference</p>
            <p className="text-sm text-slate-500">What we are owed minus what we owe</p>
            <p
              className={`mt-4 text-3xl font-extrabold tabular-nums ${
                owedToUsTotal - weOweTotal >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {formatMoney(owedToUsTotal - weOweTotal)}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader
            icon={ArrowUpRight}
            title="Money customers owe us"
            subtitle="Sales that went out on credit. Oldest first — chase these."
          />
          <DataTable
            columns={columnsFor('sale')}
            rows={owedToUs}
            onRowClick={(row) => navigate(row.to)}
            empty={{
              icon: PartyPopper,
              title: 'Every customer has paid',
              message: 'Nothing is outstanding on the selling side.',
            }}
          />
        </Card>

        <Card>
          <CardHeader
            icon={ArrowDownRight}
            title="Money we owe suppliers"
            subtitle="Stock taken on credit. Oldest first — settle these."
          />
          <DataTable
            columns={columnsFor('purchase')}
            rows={weOwe}
            onRowClick={(row) => navigate(row.to)}
            empty={{
              icon: PartyPopper,
              title: 'Every supplier has been paid',
              message: 'Nothing is outstanding on the buying side.',
            }}
          />
        </Card>
      </PageBody>

      <ConfirmDialog
        open={Boolean(asking)}
        title={asking?.kind === 'sale' ? 'Record money received?' : 'Record money paid?'}
        message={
          asking?.kind === 'sale'
            ? 'This marks the sale as paid and adds a cash-in line to the ledger.'
            : 'This marks the purchase as paid and adds a cash-out line to the ledger.'
        }
        detail={
          asking ? (
            <span>
              {asking.kind === 'sale' ? 'From ' : 'To '}
              <span className="font-bold">{asking.partyName}</span>
              <br />
              Amount: <span className="font-bold">{formatMoney(asking.amount)}</span>
            </span>
          ) : null
        }
        confirmLabel="Yes, record it"
        cancelLabel="No, go back"
        onConfirm={confirmSettle}
        onCancel={() => setAsking(null)}
      />
    </>
  )
}
