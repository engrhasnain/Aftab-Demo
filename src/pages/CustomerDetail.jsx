import { useNavigate, useParams } from 'react-router-dom'
import { MapPin, Pencil, Phone, ShoppingBag } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import { DetailItem, DetailList } from '../components/ui/DetailList'
import RecordNotFound from '../components/ui/RecordNotFound'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import { getCustomer, salesForCustomer } from '../utils/selectors'
import { formatDate, formatMoney } from '../utils/format'

export default function CustomerDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const customer = getCustomer(data, id)

  if (!customer) {
    return <RecordNotFound title="Customer" backTo="/customers" backLabel="Back to customers" />
  }

  const sales = salesForCustomer(data, customer.id)
  const totalSold = sales.reduce((total, sale) => total + sale.totalAmount, 0)
  const lastSale = sales.length ? sales[0].saleDate : null

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle="Customer details"
        back={{ to: '/customers', label: 'Back to customers' }}
        action={
          <>
            <LinkButton to={`/customers/${customer.id}/edit`} variant="secondary" icon={Pencil}>
              Edit details
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
            <CardHeader title="Contact information" />
            <CardBody>
              <DetailList>
                <DetailItem label="Name" wide>
                  {customer.name}
                </DetailItem>
                <DetailItem label="Full address" wide>
                  <span className="flex items-start gap-2">
                    <MapPin size={20} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
                    {customer.longAddress}
                  </span>
                </DetailItem>
                <DetailItem label="Short address">{customer.shortAddress}</DetailItem>
                <DetailItem label="Contact number">
                  <span className="flex items-center gap-2 tabular-nums">
                    <Phone size={18} className="text-slate-400" aria-hidden="true" />
                    {customer.contactNumber}
                  </span>
                </DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Sales recorded</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{sales.length}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total sold</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatMoney(totalSold)}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Last sale</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {lastSale ? formatDate(lastSale) : 'None yet'}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={ShoppingBag}
            title="Recent sales to this customer"
            subtitle="Newest first. Click a row to see everything that was sold."
          />
          <DataTable
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (row) => <span className="whitespace-nowrap font-semibold">{formatDate(row.saleDate)}</span>,
              },
              { key: 'items', header: 'Items', align: 'center', render: (row) => <span className="tabular-nums">{row.items.length}</span> },
              {
                key: 'total',
                header: 'Total amount',
                align: 'right',
                render: (row) => <span className="font-semibold tabular-nums">{formatMoney(row.totalAmount)}</span>,
              },
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
            rows={sales.slice(0, 10)}
            onRowClick={(row) => navigate(`/sales/${row.id}`)}
            empty={{
              icon: ShoppingBag,
              title: 'No sales to this customer yet',
              message: 'Record a sale and choose this customer to see it listed here.',
              action: <LinkButton to="/sales/new">Record sale</LinkButton>,
            }}
          />
        </Card>
      </PageBody>
    </>
  )
}
