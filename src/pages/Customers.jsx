import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Store } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import { LinkButton } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useData } from '../context/DataContext'
import { salesForCustomer } from '../utils/selectors'
import { formatMoney } from '../utils/format'

export default function Customers() {
  const data = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.customers
      .filter((customer) =>
        term
          ? [customer.name, customer.shortAddress, customer.contactNumber]
              .some((field) => String(field).toLowerCase().includes(term))
          : true,
      )
      .map((customer) => {
        const sales = salesForCustomer(data, customer.id)
        return {
          ...customer,
          saleCount: sales.length,
          totalSold: sales.reduce((total, sale) => total + sale.totalAmount, 0),
        }
      })
  }, [data, search])

  const justAdded = data.lastCreated && data.lastCreated.type === 'customer' ? data.lastCreated.id : null

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => <span className="tabular-nums font-semibold text-slate-500">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          {row.name}
          <Badge tone={row.taxStatus === 'filer' ? 'green' : 'slate'}>
            {row.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}
          </Badge>
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
        </span>
      ),
    },
    { key: 'shortAddress', header: 'Short address', render: (row) => row.shortAddress },
    {
      key: 'contactNumber',
      header: 'Contact number',
      render: (row) => <span className="whitespace-nowrap tabular-nums">{row.contactNumber}</span>,
    },
    {
      key: 'saleCount',
      header: 'Sales',
      align: 'right',
      render: (row) => <span className="font-semibold tabular-nums">{row.saleCount}</span>,
    },
    {
      key: 'totalSold',
      header: 'Total sold',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatMoney(row.totalSold)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="The shops and stores we sell to."
        action={
          <LinkButton to="/customers/new" icon={Plus} size="lg">
            Add customer
          </LinkButton>
        }
      />

      <PageBody>
        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="customer-search"
              label="Search by name, area or phone number"
              value={search}
              onChange={setSearch}
              placeholder="e.g. Lahore, or 0321-4488…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
            rowClassName={(row) => (row.id === justAdded ? 'bg-brand-50' : '')}
            empty={
              search
                ? {
                    icon: Store,
                    title: 'No customers match that search',
                    message: `Nothing found for "${search}". Try a shorter piece of the name.`,
                  }
                : {
                    icon: Store,
                    title: 'No customers yet',
                    message: 'Add the shops you sell to and they will appear in this list.',
                    action: (
                      <LinkButton to="/customers/new" icon={Plus} size="lg">
                        Add customer
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        {rows.length ? (
          <p className="text-base text-slate-600">
            Showing {rows.length} of {data.customers.length} customers. Click any row to see full details.
          </p>
        ) : null}
      </PageBody>
    </>
  )
}
