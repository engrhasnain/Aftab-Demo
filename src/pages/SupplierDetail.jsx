import { useNavigate, useParams } from 'react-router-dom'
import { MapPin, Package, Pencil, Phone, ShoppingCart } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import { DetailItem, DetailList } from '../components/ui/DetailList'
import RecordNotFound from '../components/ui/RecordNotFound'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import { getSupplier, groupName, productStockQty, productsForSupplier, purchasesForSupplier } from '../utils/selectors'
import { formatDate, formatMoney, formatNumber } from '../utils/format'

export default function SupplierDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const supplier = getSupplier(data, id)

  if (!supplier) {
    return <RecordNotFound title="Supplier" backTo="/suppliers" backLabel="Back to suppliers" />
  }

  const products = productsForSupplier(data, supplier.id)
  const purchases = purchasesForSupplier(data, supplier.id)
  const totalBought = purchases.reduce((total, purchase) => total + purchase.totalAmount, 0)

  return (
    <>
      <PageHeader
        title={supplier.name}
        subtitle="Supplier details"
        back={{ to: '/suppliers', label: 'Back to suppliers' }}
        action={
          <>
            <LinkButton to={`/suppliers/${supplier.id}/edit`} variant="secondary" icon={Pencil}>
              Edit details
            </LinkButton>
            <LinkButton to="/purchases/new" icon={ShoppingCart}>
              Record purchase
            </LinkButton>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Contact information" />
            <CardBody>
              <DetailList>
                <DetailItem label="Name" wide>
                  {supplier.name}
                </DetailItem>
                <DetailItem label="Full address" wide>
                  <span className="flex items-start gap-2">
                    <MapPin size={20} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
                    {supplier.longAddress}
                  </span>
                </DetailItem>
                <DetailItem label="Short address">{supplier.shortAddress}</DetailItem>
                <DetailItem label="Contact number">
                  <span className="flex items-center gap-2 tabular-nums">
                    <Phone size={18} className="text-slate-400" aria-hidden="true" />
                    {supplier.contactNumber}
                  </span>
                </DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Products supplied</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{products.length}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Purchases recorded</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{purchases.length}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total bought</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatMoney(totalBought)}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={Package}
            title="Products from this supplier"
            subtitle="Click a product to see its pricing and stock batches."
          />
          <DataTable
            columns={[
              { key: 'name', header: 'Product', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
              { key: 'group', header: 'Group', render: (row) => groupName(data, row.groupId) },
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
                render: (row) => <span className="font-semibold tabular-nums">{formatNumber(productStockQty(data, row.id))}</span>,
              },
            ]}
            rows={products}
            onRowClick={(row) => navigate(`/products/${row.id}`)}
            empty={{
              icon: Package,
              title: 'No products from this supplier yet',
              message: 'Add a product and choose this supplier to see it listed here.',
              action: <LinkButton to="/products/new">Add product</LinkButton>,
            }}
          />
        </Card>

        <Card>
          <CardHeader
            icon={ShoppingCart}
            title="Recent purchases from this supplier"
            subtitle="Newest first. Click a row to see the full purchase."
          />
          <DataTable
            columns={[
              { key: 'date', header: 'Date', render: (row) => <span className="whitespace-nowrap font-semibold">{formatDate(row.purchaseDate)}</span> },
              { key: 'items', header: 'Items', align: 'center', render: (row) => <span className="tabular-nums">{row.items.length}</span> },
              { key: 'total', header: 'Total amount', align: 'right', render: (row) => <span className="font-semibold tabular-nums">{formatMoney(row.totalAmount)}</span> },
              {
                key: 'status',
                header: 'Payment',
                render: (row) => (
                  <Badge tone={row.paymentStatus === 'paid' ? 'green' : 'amber'}>
                    {row.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                ),
              },
            ]}
            rows={purchases.slice(0, 8)}
            onRowClick={(row) => navigate(`/purchases/${row.id}`)}
            empty={{
              icon: ShoppingCart,
              title: 'No purchases from this supplier yet',
              message: 'Once you record a purchase from them it will show up here.',
              action: <LinkButton to="/purchases/new">Record purchase</LinkButton>,
            }}
          />
        </Card>
      </PageBody>
    </>
  )
}
