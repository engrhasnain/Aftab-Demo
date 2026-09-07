import { Link, useNavigate, useParams } from 'react-router-dom'
import { History, Layers, Pencil, ShoppingBag, Truck, Warehouse } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import ExpiryBadge from '../components/ui/ExpiryBadge'
import Badge from '../components/ui/Badge'
import { DetailItem, DetailList } from '../components/ui/DetailList'
import RecordNotFound from '../components/ui/RecordNotFound'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import {
  activeOfferForProduct,
  batchMovements,
  batchesForProduct,
  getProduct,
  groupName,
  productSellableQty,
  productStockQty,
  supplierName,
} from '../utils/selectors'
import { expiryStatus, formatDate, formatMoney, formatNumber } from '../utils/format'
import { describeOffer } from '../utils/tax'

export default function ProductDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const product = getProduct(data, id)

  if (!product) {
    return <RecordNotFound title="Product" backTo="/products" backLabel="Back to products" />
  }

  const unit = product.unit || 'unit'
  const batches = batchesForProduct(data, product.id)
  const stockQty = productStockQty(data, product.id)
  const sellableQty = productSellableQty(data, product.id)
  const stockValue = sellableQty * product.purchaseCost

  // Everything that has moved any batch of this product, newest first.
  const offer = activeOfferForProduct(data, product.id)
  const movements = batches
    .flatMap((batch) => batchMovements(data, batch.id).map((row) => ({ ...row, batchNumber: batch.batchNumber })))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
    .slice(0, 12)

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle="Product details"
        back={{ to: '/products', label: 'Back to products' }}
        action={
          <>
            <LinkButton to={`/products/${product.id}/edit`} variant="secondary" icon={Pencil}>
              Edit product
            </LinkButton>
            <LinkButton to="/sales/new" icon={ShoppingBag}>
              Record sale
            </LinkButton>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Pricing" subtitle="All prices are in Pakistani Rupees, per single unit." />
            <CardBody>
              <DetailList>
                <DetailItem label={`MRP — printed retail price, per ${unit}`}>{formatMoney(product.mrp)}</DetailItem>
                <DetailItem label={`TP — trade price to shops, per ${unit}`}>{formatMoney(product.tp)}</DetailItem>
                <DetailItem label={`Purchase cost — what we pay, per ${unit}`}>
                  {formatMoney(product.purchaseCost)}
                </DetailItem>
                <DetailItem label="Sales tax">
                  {product.taxable ? `${product.salesTaxPercent}%` : 'Not taxed'}
                </DetailItem>
                <DetailItem label="Offer running" wide>
                  {offer ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone="green">{describeOffer(offer)}</Badge>
                      <span className="text-base font-normal text-slate-600">{offer.name}</span>
                    </span>
                  ) : (
                    <span className="text-base font-normal text-slate-500">None today</span>
                  )}
                </DetailItem>
                <DetailItem label="Sold as">
                  1 {unit}
                  {product.unitsPerCarton ? ` · ${product.unitsPerCarton} ${unit}s per carton` : ''}
                </DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Where it comes from" />
            <CardBody className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Supplier</p>
                <Link
                  to={`/suppliers/${product.supplierId}`}
                  className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-brand-700 hover:underline"
                >
                  <Truck size={20} aria-hidden="true" />
                  {supplierName(data, product.supplierId)}
                </Link>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Group</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Layers size={20} className="text-slate-400" aria-hidden="true" />
                  {groupName(data, product.groupId)}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">In stock</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">
                  {formatNumber(sellableQty)} <span className="text-lg font-semibold text-slate-500">{unit}s</span>
                </p>
                <p className="text-sm text-slate-500">Worth {formatMoney(stockValue)} at what we paid</p>
                {stockQty !== sellableQty ? (
                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {formatNumber(stockQty - sellableQty)} more {unit}s are expired and cannot be sold.
                  </p>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={Warehouse}
            title="Stock batches"
            subtitle="Soonest expiry first. Batches close to their expiry date are highlighted."
            action={
              <LinkButton to="/stock" variant="secondary">
                Open stock
              </LinkButton>
            }
          />
          <DataTable
            columns={[
              {
                key: 'batchNumber',
                header: 'Batch number',
                render: (row) => <span className="font-semibold text-slate-900">{row.batchNumber}</span>,
              },
              { key: 'expiry', header: 'Expiry date', render: (row) => <ExpiryBadge date={row.expiryDate} /> },
              {
                key: 'qty',
                header: 'Quantity on hand',
                align: 'right',
                render: (row) => (
                  <span className={`font-bold tabular-nums ${row.qtyOnHand === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                    {formatNumber(row.qtyOnHand)} <span className="font-normal text-slate-500">{unit}s</span>
                  </span>
                ),
              },
              {
                key: 'value',
                header: 'Value at cost',
                align: 'right',
                render: (row) =>
                  expiryStatus(row.expiryDate).level === 'expired' && row.qtyOnHand > 0 ? (
                    <Badge tone="red">Counted as nil</Badge>
                  ) : (
                    <span className="tabular-nums">{formatMoney(row.qtyOnHand * product.purchaseCost)}</span>
                  ),
              },
            ]}
            rows={batches}
            rowClassName={(row) => {
              if (row.qtyOnHand === 0) return 'opacity-60'
              const level = expiryStatus(row.expiryDate).level
              if (level === 'expired' || level === 'critical') return 'bg-red-50'
              if (level === 'warning') return 'bg-amber-50'
              return ''
            }}
            empty={{
              icon: Warehouse,
              title: 'No stock batches for this product',
              message: 'Record a purchase of this product and the batch will appear here automatically.',
              action: <LinkButton to="/purchases/new">Record purchase</LinkButton>,
            }}
          />
        </Card>

        <Card>
          <CardHeader
            icon={History}
            title="Recent movement"
            subtitle="Why the stock is what it is — every purchase, sale and write-off that touched it."
          />
          <DataTable
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (row) => <span className="whitespace-nowrap font-semibold">{formatDate(row.date)}</span>,
              },
              {
                key: 'what',
                header: 'What happened',
                render: (row) => (
                  <span className={row.cancelled ? 'text-slate-500 line-through' : 'text-slate-800'}>{row.label}</span>
                ),
              },
              { key: 'batch', header: 'Batch', render: (row) => row.batchNumber },
              {
                key: 'qty',
                header: 'Change',
                align: 'right',
                render: (row) =>
                  row.cancelled ? (
                    <Badge tone="slate">Cancelled</Badge>
                  ) : (
                    <span
                      className={`font-bold tabular-nums ${row.qty > 0 ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                      {row.qty > 0 ? '+' : ''}
                      {formatNumber(row.qty)}
                    </span>
                  ),
              },
            ]}
            rows={movements}
            rowKey={(row) => row.key}
            onRowClick={(row) => navigate(row.to)}
            empty={{
              icon: History,
              title: 'Nothing has moved yet',
              message: 'Purchases, sales and write-offs of this product will be listed here.',
            }}
          />
        </Card>
      </PageBody>
    </>
  )
}
