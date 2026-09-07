import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Package, Plus } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import Badge from '../components/ui/Badge'
import ColourDot from '../components/ui/ColourDot'
import Button, { LinkButton } from '../components/ui/Button'
import { Field, Select } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { batchesForProduct, groupName, productStockQty, supplierName } from '../utils/selectors'
import { formatMoney, formatNumber, isExpiringSoon } from '../utils/format'

export default function Products() {
  const data = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.products
      .filter((product) => (term ? product.name.toLowerCase().includes(term) : true))
      .filter((product) => (groupFilter === 'all' ? true : product.groupId === groupFilter))
      .filter((product) => (supplierFilter === 'all' ? true : product.supplierId === supplierFilter))
      .map((product) => {
        const batches = batchesForProduct(data, product.id)
        return {
          ...product,
          stockQty: productStockQty(data, product.id),
          expiringBatches: batches.filter((batch) => batch.qtyOnHand > 0 && isExpiringSoon(batch.expiryDate)).length,
        }
      })
  }, [data, search, groupFilter, supplierFilter])

  const justAdded = data.lastCreated && data.lastCreated.type === 'product' ? data.lastCreated.id : null
  const filtersActive = Boolean(search) || groupFilter !== 'all' || supplierFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setGroupFilter('all')
    setSupplierFilter('all')
  }

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
          <ColourDot colour={row.colour} />
          {row.name}
          {row.controlled ? <Badge tone="red">Controlled</Badge> : null}
          {!row.taxable ? <Badge tone="slate">No tax</Badge> : null}
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
        </span>
      ),
    },
    { key: 'group', header: 'Group', render: (row) => groupName(data, row.groupId) },
    { key: 'supplier', header: 'Supplier', render: (row) => supplierName(data, row.supplierId) },
    { key: 'mrp', header: 'MRP', align: 'right', render: (row) => <span className="tabular-nums">{formatMoney(row.mrp)}</span> },
    { key: 'tp', header: 'TP', align: 'right', render: (row) => <span className="tabular-nums">{formatMoney(row.tp)}</span> },
    {
      key: 'cost',
      header: 'Purchase cost',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatMoney(row.purchaseCost)}</span>,
    },
    {
      key: 'stock',
      header: 'In stock',
      align: 'right',
      render: (row) => (
        <span className="flex items-center justify-end gap-2">
          {row.expiringBatches ? (
            <Badge tone="amber" icon={AlertTriangle}>
              {row.expiringBatches} expiring
            </Badge>
          ) : null}
          <span className={`font-bold tabular-nums ${row.stockQty === 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatNumber(row.stockQty)} <span className="font-normal text-slate-500">{row.unit}s</span>
          </span>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Everything Raso buys and sells, with prices and current stock."
        action={
          <LinkButton to="/products/new" icon={Plus} size="lg">
            Add product
          </LinkButton>
        }
      />

      <PageBody>
        <Card>
          <CardBody className="border-b border-slate-200">
            <div className="grid gap-5 lg:grid-cols-3">
              <SearchInput
                id="product-search"
                label="Search by name"
                value={search}
                onChange={setSearch}
                placeholder="Start typing a product name…"
              />

              <Field label="Filter by group" htmlFor="group-filter">
                <Select id="group-filter" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                  <option value="all">All groups</option>
                  {data.productGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Filter by supplier" htmlFor="supplier-filter">
                <Select
                  id="supplier-filter"
                  value={supplierFilter}
                  onChange={(event) => setSupplierFilter(event.target.value)}
                >
                  <option value="all">All suppliers</option>
                  {data.suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {filtersActive ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-base text-slate-600">
                  Showing {rows.length} of {data.products.length} products.
                </p>
                <Button variant="subtle" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/products/${row.id}`)}
            rowClassName={(row) => (row.id === justAdded ? 'bg-brand-50' : '')}
            empty={
              filtersActive
                ? {
                    icon: Package,
                    title: 'No products match these filters',
                    message: 'Try clearing the filters to see the full list again.',
                    action: (
                      <Button variant="secondary" size="lg" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ),
                  }
                : {
                    icon: Package,
                    title: 'No products yet',
                    message: 'Add your first product to start recording purchases and sales.',
                    action: (
                      <LinkButton to="/products/new" icon={Plus} size="lg">
                        Add product
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        <p className="text-base text-slate-600">
          <span className="font-semibold">MRP</span> is the printed retail price,{' '}
          <span className="font-semibold">TP</span> the trade price to shops, and{' '}
          <span className="font-semibold">Purchase cost</span> is what Raso pays the supplier. Click any row for
          full details.
        </p>
      </PageBody>
    </>
  )
}
