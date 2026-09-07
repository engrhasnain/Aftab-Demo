import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import Badge from '../components/ui/Badge'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import { purchasesNewestFirst, supplierName } from '../utils/selectors'
import { formatDate, formatMoney } from '../utils/format'

export default function Purchases() {
  const data = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return purchasesNewestFirst(data)
      .map((purchase) => ({ ...purchase, supplier: supplierName(data, purchase.supplierId) }))
      .filter((purchase) => (term ? purchase.supplier.toLowerCase().includes(term) : true))
  }, [data, search])

  const justAdded = data.lastCreated && data.lastCreated.type === 'purchase' ? data.lastCreated.id : null
  // Cancelled purchases stay visible but never count towards the total.
  const liveRows = rows.filter((purchase) => purchase.status !== 'reversed')
  const totalValue = liveRows.reduce((total, purchase) => total + purchase.totalAmount, 0)

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
            {formatDate(row.purchaseDate)}
          </span>
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
        </span>
      ),
    },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier },
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
        title="Purchases"
        subtitle="Stock we have bought in — money we paid."
        action={
          <LinkButton to="/purchases/new" icon={Plus} size="lg">
            Record purchase
          </LinkButton>
        }
      />

      <PageBody>
        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="purchase-search"
              label="Search by supplier"
              value={search}
              onChange={setSearch}
              placeholder="Start typing a supplier name…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/purchases/${row.id}`)}
            rowClassName={(row) =>
              row.status === 'reversed' ? 'bg-slate-50 opacity-70' : row.id === justAdded ? 'bg-brand-50' : ''
            }
            empty={
              search
                ? {
                    icon: ShoppingCart,
                    title: 'No purchases match that search',
                    message: `Nothing found for "${search}".`,
                  }
                : {
                    icon: ShoppingCart,
                    title: 'No purchases recorded yet',
                    message:
                      'Record your first purchase. Stock and cash are updated automatically when you do.',
                    action: (
                      <LinkButton to="/purchases/new" icon={Plus} size="lg">
                        Record purchase
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        {rows.length ? (
          <p className="text-base text-slate-600">
            {liveRows.length} purchase{liveRows.length === 1 ? '' : 's'} shown, worth{' '}
            <span className="font-semibold text-slate-900">{formatMoney(totalValue)}</span> in total. Click any row to
            see its line items.
          </p>
        ) : null}
      </PageBody>
    </>
  )
}
