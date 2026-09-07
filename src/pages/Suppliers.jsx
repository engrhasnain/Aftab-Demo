import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Truck } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import { LinkButton } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ColourDot from '../components/ui/ColourDot'
import { useData } from '../context/DataContext'
import { productsForSupplier } from '../utils/selectors'

export default function Suppliers() {
  const data = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.suppliers
      .filter((supplier) =>
        term
          ? [supplier.name, supplier.shortAddress, supplier.contactNumber]
              .some((field) => String(field).toLowerCase().includes(term))
          : true,
      )
      .map((supplier) => ({ ...supplier, productCount: productsForSupplier(data, supplier.id).length }))
  }, [data, search])

  const justAdded = data.lastCreated && data.lastCreated.type === 'supplier' ? data.lastCreated.id : null

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
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <ColourDot colour={row.colour} />
          {row.name}
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
      key: 'productCount',
      header: 'Products supplied',
      align: 'right',
      render: (row) => <span className="font-semibold tabular-nums">{row.productCount}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="The companies we buy our products from."
        action={
          <LinkButton to="/suppliers/new" icon={Plus} size="lg">
            Add supplier
          </LinkButton>
        }
      />

      <PageBody>
        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="supplier-search"
              label="Search by name, area or phone number"
              value={search}
              onChange={setSearch}
              placeholder="e.g. Karachi, or 021-3506…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/suppliers/${row.id}`)}
            rowClassName={(row) => (row.id === justAdded ? 'bg-brand-50' : '')}
            empty={
              search
                ? {
                    icon: Truck,
                    title: 'No suppliers match that search',
                    message: `Nothing found for "${search}". Try a shorter piece of the name.`,
                  }
                : {
                    icon: Truck,
                    title: 'No suppliers yet',
                    message: 'Add the companies you buy from and they will appear in this list.',
                    action: (
                      <LinkButton to="/suppliers/new" icon={Plus} size="lg">
                        Add supplier
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        {rows.length ? (
          <p className="text-base text-slate-600">
            Showing {rows.length} of {data.suppliers.length} suppliers. Click any row to see full details.
          </p>
        ) : null}
      </PageBody>
    </>
  )
}
