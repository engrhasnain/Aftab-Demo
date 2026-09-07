import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import Badge from '../components/ui/Badge'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import { customerName, salesNewestFirst } from '../utils/selectors'
import { formatDate, formatMoney } from '../utils/format'

export default function Sales() {
  const data = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return salesNewestFirst(data)
      .map((sale) => ({ ...sale, customer: customerName(data, sale.customerId) }))
      .filter((sale) => (term ? sale.customer.toLowerCase().includes(term) : true))
  }, [data, search])

  const justAdded = data.lastCreated && data.lastCreated.type === 'sale' ? data.lastCreated.id : null
  // Cancelled sales stay visible but never count towards the total.
  const liveRows = rows.filter((sale) => sale.status !== 'reversed')
  const totalValue = liveRows.reduce((total, sale) => total + sale.totalAmount, 0)

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="flex items-center gap-2">
          <span
            className={`whitespace-nowrap font-semibold ${
              row.status === 'reversed' ? 'text-slate-500 line-through' : 'text-slate-900'
            }`}
          >
            {formatDate(row.saleDate)}
          </span>
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
        </span>
      ),
    },
    { key: 'customer', header: 'Customer', render: (row) => row.customer },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.items.length}</span>,
    },
    {
      key: 'total',
      header: 'Total amount',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums text-slate-900">{formatMoney(row.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Payment',
      render: (row) =>
        row.status === 'reversed' ? (
          <Badge tone="slate">Cancelled</Badge>
        ) : (
          <Badge tone={row.paymentStatus === 'paid' ? 'green' : 'amber'}>
            {row.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Stock we have sold out — money we received."
        action={
          <LinkButton to="/sales/new" icon={Plus} size="lg">
            Record sale
          </LinkButton>
        }
      />

      <PageBody>
        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="sale-search"
              label="Search by customer"
              value={search}
              onChange={setSearch}
              placeholder="Start typing a customer name…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/sales/${row.id}`)}
            rowClassName={(row) =>
              row.status === 'reversed' ? 'bg-slate-50 opacity-70' : row.id === justAdded ? 'bg-brand-50' : ''
            }
            empty={
              search
                ? {
                    icon: ShoppingBag,
                    title: 'No sales match that search',
                    message: `Nothing found for "${search}".`,
                  }
                : {
                    icon: ShoppingBag,
                    title: 'No sales recorded yet',
                    message: 'Record your first sale. Stock and cash are updated automatically when you do.',
                    action: (
                      <LinkButton to="/sales/new" icon={Plus} size="lg">
                        Record sale
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        {rows.length ? (
          <p className="text-base text-slate-600">
            {liveRows.length} sale{liveRows.length === 1 ? '' : 's'} shown, worth{' '}
            <span className="font-semibold text-slate-900">{formatMoney(totalValue)}</span> in total. Click any row to
            see what was sold.
          </p>
        ) : null}
      </PageBody>
    </>
  )
}
