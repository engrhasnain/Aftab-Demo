import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, Search, Store, Warehouse } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import ExpiryBadge from '../components/ui/ExpiryBadge'
import { InlineNote } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import {
  controlledProducts,
  taxStatusSummary,
  controlledRegister,
  licenceStatus,
  licenceWatchlist,
  traceBatch,
} from '../utils/selectors'
import { formatDate, formatMoney, formatNumber } from '../utils/format'

const TABS = [
  { id: 'licences', label: 'Customer licences' },
  { id: 'taxstatus', label: 'Filer / non-filer' },
  { id: 'recall', label: 'Batch trace & recall' },
  { id: 'controlled', label: 'Controlled register' },
  { id: 'sops', label: 'Written procedures' },
]

/**
 * The regulatory side of a medicine distributor, in one place: who may legally
 * be supplied, where a batch went if it has to be recalled, the register of
 * controlled items, and the written procedures the business works to.
 */
export default function Compliance() {
  const data = useData()
  const navigate = useNavigate()
  const [tab, setTab] = useState('licences')
  const [batchQuery, setBatchQuery] = useState('')

  const watchlist = licenceWatchlist(data)
  const expiredCount = watchlist.filter((r) => r.status.state === 'expired').length
  const register = useMemo(() => controlledRegister(data), [data])
  const controlled = controlledProducts(data)
  const trace = useMemo(() => traceBatch(data, batchQuery), [data, batchQuery])
  const taxStatus = useMemo(() => taxStatusSummary(data), [data])

  return (
    <>
      <PageHeader
        title="Compliance"
        subtitle="Licences, recalls, controlled medicines and the written procedures."
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div
            className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${
              expiredCount ? 'border-l-4 border-l-red-600' : ''
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Expired licences</p>
            <p className={`mt-3 text-3xl font-extrabold ${expiredCount ? 'text-red-700' : 'text-slate-900'}`}>
              {expiredCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">customers who cannot be supplied</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Expiring within 60 days</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {watchlist.filter((r) => r.status.state === 'expiring').length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Controlled products</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{controlled.length}</p>
            <p className="mt-1 text-sm text-slate-500">{register.length} movements on the register</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Written procedures</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{data.sopDocuments.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {TABS.map((entry) => (
            <Button
              key={entry.id}
              size="lg"
              variant={tab === entry.id ? 'primary' : 'secondary'}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </div>

        {/* ---------------- licences ---------------- */}
        {tab === 'licences' ? (
          <>
            <Card>
              <CardHeader
                icon={AlertTriangle}
                title="Licences that need attention"
                subtitle="Soonest first. A shop cannot legally be supplied medicines on an expired licence."
              />
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Customer',
                    render: (row) => (
                      <span>
                        <span className="block font-semibold text-slate-900">{row.customer.name}</span>
                        <span className="block text-sm text-slate-500">{row.customer.businessTitle}</span>
                      </span>
                    ),
                  },
                  { key: 'licence', header: 'Licence number', render: (row) => row.customer.licenceNumber || '—' },
                  {
                    key: 'expiry',
                    header: 'Expires',
                    render: (row) =>
                      row.customer.licenceExpiry ? <ExpiryBadge date={row.customer.licenceExpiry} /> : '—',
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => <Badge tone={row.status.tone}>{row.status.label}</Badge>,
                  },
                  { key: 'phone', header: 'Phone', render: (row) => row.customer.contactNumber },
                ]}
                rows={watchlist}
                rowKey={(row) => row.customer.id}
                onRowClick={(row) => navigate(`/customers/${row.customer.id}`)}
                rowClassName={(row) => (row.status.state === 'expired' ? 'bg-red-50' : 'bg-amber-50')}
                empty={{
                  icon: CheckCircle2,
                  title: 'Every licence is in date',
                  message: 'No customer licence has expired or is close to expiring.',
                }}
              />
            </Card>

            <Card>
              <CardHeader title="All customers" subtitle="Licence position and tax status for everyone." />
              <DataTable
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span>,
                  },
                  {
                    key: 'name',
                    header: 'Customer',
                    render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
                  },
                  {
                    key: 'tax',
                    header: 'Tax status',
                    render: (row) => (
                      <Badge tone={row.taxStatus === 'filer' ? 'green' : 'slate'}>
                        {row.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}
                      </Badge>
                    ),
                  },
                  { key: 'ntn', header: 'NTN', render: (row) => row.ntn || '—' },
                  {
                    key: 'licence',
                    header: 'Licence',
                    render: (row) => {
                      const status = licenceStatus(row)
                      return <Badge tone={status.tone}>{status.label}</Badge>
                    },
                  },
                ]}
                rows={data.customers}
                onRowClick={(row) => navigate(`/customers/${row.id}`)}
              />
            </Card>
          </>
        ) : null}

        {/* ---------------- filer / non-filer ---------------- */}
        {tab === 'taxstatus' ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border-l-4 border-l-emerald-600 border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Filers</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{taxStatus.filers.length}</p>
                <p className="mt-1 text-sm text-slate-500">{formatMoney(taxStatus.filerSupplied)} supplied</p>
              </div>
              <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Non-filers</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{taxStatus.nonFilers.length}</p>
                <p className="mt-1 text-sm text-slate-500">{formatMoney(taxStatus.nonFilerSupplied)} supplied</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Further tax collected</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {formatMoney(taxStatus.furtherTaxCollected)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {taxStatus.rate ? `at ${taxStatus.rate}% on non-filers` : 'further tax is switched off'}
                </p>
              </div>
              <div
                className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${
                  taxStatus.missingNtn ? 'border-l-4 border-l-red-600' : ''
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Filers without an NTN</p>
                <p className={`mt-3 text-3xl font-extrabold ${taxStatus.missingNtn ? 'text-red-700' : 'text-slate-900'}`}>
                  {taxStatus.missingNtn}
                </p>
                <p className="mt-1 text-sm text-slate-500">a filer should have a tax number on file</p>
              </div>
            </div>

            <Card>
              <CardHeader
                title="Tax status by customer"
                subtitle="What each customer costs on the invoice, and what registering would save them."
              />
              <DataTable
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span>,
                  },
                  {
                    key: 'name',
                    header: 'Customer',
                    render: (row) => (
                      <span>
                        <span className="block font-semibold text-slate-900">{row.name}</span>
                        <span className="block text-sm text-slate-500">{row.businessTitle}</span>
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => (
                      <Badge tone={row.taxStatus === 'filer' ? 'green' : 'amber'}>
                        {row.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'ntn',
                    header: 'NTN',
                    render: (row) =>
                      row.ntn ? (
                        <span className="tabular-nums">{row.ntn}</span>
                      ) : row.taxStatus === 'filer' ? (
                        <Badge tone="red">Missing</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      ),
                  },
                  {
                    key: 'supplied',
                    header: 'Goods supplied',
                    align: 'right',
                    render: (row) => <span className="tabular-nums">{formatMoney(row.supplied)}</span>,
                  },
                  {
                    key: 'further',
                    header: 'Further tax charged',
                    align: 'right',
                    render: (row) =>
                      row.furtherTaxCharged ? (
                        <span className="font-bold tabular-nums text-amber-800">
                          {formatMoney(row.furtherTaxCharged)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      ),
                  },
                ]}
                rows={taxStatus.rows}
                onRowClick={(row) => navigate(row.to)}
                rowClassName={(row) => (row.taxStatus === 'non-filer' ? 'bg-amber-50/60' : '')}
              />
            </Card>

            <InlineNote icon={Info}>
              A buyer who is not on the tax roll is charged an extra percentage — further tax — on the goods value.
              The rate, and whether it applies at all, is set under Settings. Change a customer between filer and
              non-filer on their own page; it takes effect on their next invoice, never on old ones.
            </InlineNote>
          </>
        ) : null}

        {/* ---------------- recall ---------------- */}
        {tab === 'recall' ? (
          <>
            <Card>
              <CardHeader
                icon={Search}
                title="Trace a batch"
                subtitle="Type a batch number to see where every unit of it went."
              />
              <CardBody>
                <SearchInput
                  id="batch-trace"
                  label="Batch number"
                  value={batchQuery}
                  onChange={setBatchQuery}
                  placeholder="e.g. BCW-2404"
                />
              </CardBody>
            </Card>

            {batchQuery.trim() && !trace ? (
              <Card>
                <EmptyState
                  icon={Search}
                  title={`No batch called "${batchQuery.trim()}"`}
                  message="Check the number printed on the carton. The Stock screen lists every batch you hold."
                />
              </Card>
            ) : null}

            {trace ? (
              <>
                <Card>
                  <CardHeader
                    title={`Batch ${trace.batchNumber}`}
                    subtitle={trace.product ? trace.product.name : 'Unknown product'}
                  />
                  <CardBody>
                    <div className="grid gap-6 sm:grid-cols-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Expiry</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(trace.expiryDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Still on our shelf</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                          {formatNumber(trace.stillOnShelf)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Already shipped out</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums text-red-700">
                          {formatNumber(trace.shipped)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Customers to contact</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                          {trace.customerCount}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    icon={Store}
                    title="Who received this batch"
                    subtitle="Everyone to contact if this batch has to be recalled."
                  />
                  <DataTable
                    columns={[
                      { key: 'date', header: 'Sold on', render: (row) => formatDate(row.date) },
                      {
                        key: 'party',
                        header: 'Customer',
                        render: (row) => (
                          <span className={row.cancelled ? 'text-slate-500 line-through' : 'font-semibold text-slate-900'}>
                            {row.party}
                          </span>
                        ),
                      },
                      { key: 'phone', header: 'Phone', render: (row) => row.contactNumber || '—' },
                      {
                        key: 'qty',
                        header: 'Units',
                        align: 'right',
                        render: (row) =>
                          row.cancelled ? (
                            <Badge tone="slate">Cancelled</Badge>
                          ) : (
                            <span className="font-bold tabular-nums">{formatNumber(row.qty)}</span>
                          ),
                      },
                    ]}
                    rows={trace.suppliedTo}
                    rowKey={(row, i) => row.id + '-' + i}
                    onRowClick={(row) => navigate(row.to)}
                    empty={{
                      icon: CheckCircle2,
                      title: 'None of this batch has gone out',
                      message: 'It is all still on your shelf, so nothing needs recalling.',
                    }}
                  />
                </Card>

                <Card>
                  <CardHeader icon={Warehouse} title="Where it came from" subtitle="The purchases that brought it in." />
                  <DataTable
                    columns={[
                      { key: 'date', header: 'Received', render: (row) => formatDate(row.date) },
                      {
                        key: 'party',
                        header: 'Supplier',
                        render: (row) => <span className="font-semibold text-slate-900">{row.party}</span>,
                      },
                      {
                        key: 'qty',
                        header: 'Units',
                        align: 'right',
                        render: (row) => <span className="font-bold tabular-nums">{formatNumber(row.qty)}</span>,
                      },
                    ]}
                    rows={trace.receivedFrom}
                    rowKey={(row, i) => row.id + '-' + i}
                    onRowClick={(row) => navigate(row.to)}
                  />
                </Card>
              </>
            ) : null}

            {!batchQuery.trim() ? (
              <InlineNote icon={Info}>
                This is the question an inspector asks first: “who has this batch?” Type the number and you have the
                answer, with phone numbers, in seconds.
              </InlineNote>
            ) : null}
          </>
        ) : null}

        {/* ---------------- controlled register ---------------- */}
        {tab === 'controlled' ? (
          <>
            <Card>
              <CardHeader
                icon={AlertTriangle}
                title="Controlled medicines register"
                subtitle="Every movement in and out, with a running balance, in date order."
              />
              <DataTable
                columns={[
                  { key: 'date', header: 'Date', render: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span> },
                  {
                    key: 'product',
                    header: 'Product',
                    render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span>,
                  },
                  { key: 'batch', header: 'Batch', render: (row) => row.batchNumber },
                  {
                    key: 'movement',
                    header: 'Movement',
                    render: (row) => (
                      <Badge tone={row.movement === 'Received' ? 'blue' : 'amber'}>{row.movement}</Badge>
                    ),
                  },
                  {
                    key: 'party',
                    header: 'From / to',
                    render: (row) => (
                      <span>
                        <span className="block">{row.party}</span>
                        {row.licenceNumber ? (
                          <span className="block text-sm text-slate-500">Licence {row.licenceNumber}</span>
                        ) : null}
                      </span>
                    ),
                  },
                  {
                    key: 'in',
                    header: 'In',
                    align: 'right',
                    render: (row) => (row.inQty ? <span className="font-bold tabular-nums text-emerald-700">+{row.inQty}</span> : '—'),
                  },
                  {
                    key: 'out',
                    header: 'Out',
                    align: 'right',
                    render: (row) => (row.outQty ? <span className="font-bold tabular-nums text-red-700">−{row.outQty}</span> : '—'),
                  },
                  {
                    key: 'balance',
                    header: 'Balance',
                    align: 'right',
                    render: (row) => <span className="font-bold tabular-nums text-slate-900">{row.balance}</span>,
                  },
                ]}
                rows={register}
                rowKey={(row) => row.key}
                onRowClick={(row) => navigate(row.to)}
                empty={{
                  icon: CheckCircle2,
                  title: 'No controlled items have moved',
                  message: 'Mark a product as controlled on its own page and its movements will be listed here.',
                }}
              />
            </Card>

            <Card>
              <CardHeader title="Products on the controlled list" />
              <DataTable
                columns={[
                  { key: 'code', header: 'Code', render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span> },
                  { key: 'name', header: 'Product', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
                  { key: 'mrp', header: 'MRP', align: 'right', render: (row) => <span className="tabular-nums">{formatMoney(row.mrp)}</span> },
                ]}
                rows={controlled}
                onRowClick={(row) => navigate(`/products/${row.id}`)}
                empty={{
                  icon: Info,
                  title: 'Nothing is marked as controlled',
                  message: 'Open a product, edit it, and set “controlled medicine” to yes.',
                }}
              />
            </Card>
          </>
        ) : null}

        {/* ---------------- SOPs ---------------- */}
        {tab === 'sops' ? (
          <Card>
            <CardHeader
              title="Written procedures"
              subtitle="The SOPs the business works to, with their version and next review date."
            />
            <div className="divide-y divide-slate-200">
              {data.sopDocuments.map((sop) => (
                <div key={sop.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-700">
                      {sop.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{sop.title}</h3>
                    <Badge tone="slate">{sop.category}</Badge>
                    <Badge tone="blue">Version {sop.version}</Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-base text-slate-700">{sop.summary}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Owner {sop.owner} · in force since {formatDate(sop.effectiveDate)} · next review{' '}
                    {formatDate(sop.reviewDate)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </PageBody>
    </>
  )
}
