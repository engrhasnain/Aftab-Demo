import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarClock,
  MapPin,
  Pencil,
  Phone,
  ShoppingBag,
  Truck,
  Wallet,
} from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button, { LinkButton } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import RecordNotFound from '../components/ui/RecordNotFound'
import { DetailItem, DetailList } from '../components/ui/DetailList'
import { Field, InlineNote, NumberInput, Select, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import {
  advanceHeld,
  customerName,
  getEmployee,
  payrollHistory,
  salaryStatus,
  salesBookedBy,
  salesDeliveredBy,
  soldByInMonth,
} from '../utils/selectors'
import { monthOf, payrollProblem } from '../utils/payroll'
import { formatDate, formatMonth, formatMoney, TODAY } from '../utils/format'

const MONTH = monthOf(TODAY)

const KINDS = [
  { value: 'salary', label: 'Salary payment', hint: 'Money paid against what is owed for this month.' },
  { value: 'advance', label: 'Advance', hint: 'Money handed over early, taken back from a later payment.' },
  { value: 'adjustment', label: 'Overtime or deduction', hint: 'Changes what is owed. Use a minus for a deduction.' },
]

const KIND_LABELS = { salary: 'Salary', advance: 'Advance', adjustment: 'Adjustment' }

export default function EmployeeDetail() {
  const { id } = useParams()
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const employee = getEmployee(data, id)

  const [kind, setKind] = useState('salary')
  const [amount, setAmount] = useState('')
  const [recover, setRecover] = useState('')
  const [note, setNote] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)

  const pay = useMemo(
    () => (employee ? salaryStatus(data, employee.id, MONTH) : null),
    [data, employee],
  )
  const held = employee ? advanceHeld(data, employee.id) : 0
  const history = employee ? payrollHistory(data, employee.id) : []
  const booked = employee && employee.booksSales ? salesBookedBy(data, employee.id) : []
  const delivered = employee && employee.delivers ? salesDeliveredBy(data, employee.id) : []

  if (!employee) {
    return <RecordNotFound title="Employee" backTo="/employees" backLabel="Back to employees" />
  }

  const soldThisMonth = employee.booksSales ? soldByInMonth(data, employee.id, MONTH) : 0
  const target = data.targets.find(
    (t) => t.scope === 'employee' && t.employeeId === employee.id && t.month === MONTH,
  )
  const percent = target && target.amount ? Math.round((soldThisMonth / target.amount) * 100) : null

  const problem = payrollProblem({
    employee,
    records: data.salaryPayments,
    month: MONTH,
    kind,
    amount: Number(amount),
    advanceRecovered: Number(recover) || 0,
  })
  const canSubmit = amount !== '' && !problem

  function submit(event) {
    event.preventDefault()
    if (!canSubmit) return
    data.recordPayroll({
      employeeId: employee.id,
      month: MONTH,
      kind,
      amount: Number(amount),
      advanceRecovered: kind === 'salary' ? Number(recover) || 0 : 0,
      note,
      entryDate: TODAY,
    })
    const said =
      kind === 'advance'
        ? `${formatMoney(Number(amount))} given to ${employee.name} as an advance.`
        : kind === 'adjustment'
          ? `${formatMoney(Math.abs(Number(amount)))} ${Number(amount) < 0 ? 'taken off' : 'added to'} ${
              employee.name
            }’s pay for ${formatMonth(TODAY)}.`
          : `${formatMoney(Number(amount) - (Number(recover) || 0))} paid to ${employee.name}.`
    showToast(KIND_LABELS[kind] + ' recorded', { message: said })
    setAmount('')
    setRecover('')
    setNote('')
  }

  function markLeft() {
    setConfirmLeave(false)
    data.setEmployeeStatus(employee.id, 'left', TODAY)
    showToast(`${employee.name} marked as left`, {
      message: 'They drop off the wage bill. Everything they sold or delivered keeps their name.',
    })
  }

  const historyColumns = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.entryDate) },
    {
      key: 'kind',
      header: 'Kind',
      render: (row) => (
        <Badge tone={row.kind === 'salary' ? 'green' : row.kind === 'advance' ? 'blue' : 'amber'}>
          {KIND_LABELS[row.kind]}
        </Badge>
      ),
    },
    { key: 'month', header: 'For month', render: (row) => formatMonth(row.month + '-01') },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span
          className={`font-bold tabular-nums ${
            row.kind === 'adjustment' && row.amount < 0 ? 'text-red-700' : 'text-slate-900'
          }`}
        >
          {row.kind === 'adjustment' && row.amount > 0 ? '+ ' : ''}
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: 'cash',
      header: 'Cash paid out',
      align: 'right',
      render: (row) => {
        if (row.kind === 'adjustment') return <span className="text-slate-500">—</span>
        const cash = row.amount - (row.advanceRecovered || 0)
        return (
          <span className="tabular-nums text-slate-900">
            {formatMoney(cash)}
            {row.advanceRecovered ? (
              <span className="block text-sm text-slate-500">
                {formatMoney(row.advanceRecovered)} advance taken back
              </span>
            ) : null}
          </span>
        )
      },
    },
    { key: 'note', header: 'Note', render: (row) => <span className="text-slate-600">{row.note || '—'}</span> },
  ]

  const saleColumns = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.saleDate) },
    { key: 'customer', header: 'Customer', render: (row) => customerName(data, row.customerId) },
    {
      key: 'total',
      header: 'Invoice total',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums text-slate-900">{formatMoney(row.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Payment',
      render: (row) =>
        row.paymentStatus === 'paid' ? <Badge tone="green">Paid</Badge> : <Badge tone="amber">Unpaid</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        title={employee.name}
        subtitle={`${employee.designation} · code ${employee.code}`}
        back={{ to: '/employees', label: 'Back to employees' }}
        action={
          <>
            <LinkButton to={`/employees/${employee.id}/edit`} variant="secondary" icon={Pencil}>
              Edit details
            </LinkButton>
            {employee.status === 'active' ? (
              <Button variant="secondary" onClick={() => setConfirmLeave(true)}>
                Mark as left
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => data.setEmployeeStatus(employee.id, 'active')}>
                Bring back on the team
              </Button>
            )}
          </>
        }
      />

      <PageBody>
        {employee.status === 'left' ? (
          <InlineNote icon={AlertCircle}>
            {employee.name} left on {formatDate(employee.leftDate)}. They are off the wage bill and cannot be paid,
            but every invoice and delivery they handled still carries their name.
          </InlineNote>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---------- who they are ---------- */}
          <Card className="lg:col-span-2">
            <CardHeader title="Contact information" />
            <CardBody>
              <DetailList>
                <DetailItem label="Full name">{employee.name}</DetailItem>
                <DetailItem label="Job title">{employee.designation}</DetailItem>
                <DetailItem label="Phone number">
                  <span className="flex items-center gap-2">
                    <Phone size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {employee.phone || '—'}
                  </span>
                </DetailItem>
                <DetailItem label="CNIC">{employee.cnic || '—'}</DetailItem>
                <DetailItem label="Address" wide>
                  <span className="flex items-start gap-2">
                    <MapPin size={20} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
                    {employee.address || '—'}
                  </span>
                </DetailItem>
                <DetailItem label="Joined">
                  <span className="flex items-center gap-2">
                    <CalendarClock size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {employee.joinedDate ? formatDate(employee.joinedDate) : '—'}
                  </span>
                </DetailItem>
                <DetailItem label="Status">
                  {employee.status === 'left' ? (
                    <Badge tone="slate">Left on {formatDate(employee.leftDate)}</Badge>
                  ) : (
                    <Badge tone="green">On the team</Badge>
                  )}
                </DetailItem>
                <DetailItem label="Duties" wide>
                  <span className="flex flex-wrap gap-2">
                    {employee.booksSales ? <Badge tone="blue">Books sales</Badge> : null}
                    {employee.delivers ? <Badge tone="violet">Delivers</Badge> : null}
                    {!employee.booksSales && !employee.delivers ? (
                      <span className="text-slate-500">Not on the sales or delivery lists</span>
                    ) : null}
                  </span>
                </DetailItem>
              </DetailList>
            </CardBody>
          </Card>

          {/* ---------- where the money stands ---------- */}
          <Card>
            <CardHeader title={`Pay for ${formatMonth(TODAY)}`} />
            <CardBody className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-base text-slate-600">Monthly salary</span>
                <span className="text-lg font-bold tabular-nums text-slate-900">
                  {formatMoney(employee.monthlySalary)}
                </span>
              </div>
              {pay.adjustments ? (
                <div className="flex items-baseline justify-between">
                  <span className="text-base text-slate-600">Overtime and deductions</span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      pay.adjustments < 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {pay.adjustments > 0 ? '+ ' : ''}
                    {formatMoney(pay.adjustments)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
                <span className="text-base font-semibold text-slate-700">Owed for the month</span>
                <span className="text-xl font-extrabold tabular-nums text-slate-900">{formatMoney(pay.gross)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base text-slate-600">Paid so far</span>
                <span className="text-lg font-bold tabular-nums text-slate-900">{formatMoney(pay.settled)}</span>
              </div>
              <div
                className={`flex items-baseline justify-between rounded-xl px-4 py-3 ${
                  pay.outstanding > 0 ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'
                }`}
              >
                <span className="text-base font-semibold">
                  {pay.outstanding > 0 ? 'Still to pay' : 'Settled in full'}
                </span>
                <span className="text-xl font-extrabold tabular-nums">{formatMoney(pay.outstanding)}</span>
              </div>
              {held > 0 ? (
                <div className="flex items-baseline justify-between rounded-xl bg-sky-50 px-4 py-3 text-sky-900">
                  <span className="text-base font-semibold">Advance held</span>
                  <span className="text-lg font-extrabold tabular-nums">{formatMoney(held)}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        {/* ---------- what they sold ---------- */}
        {employee.booksSales ? (
          <Card>
            <CardHeader
              title="Sales booked"
              subtitle={`Invoices this person took the order for. This is what makes their target mean something.`}
            />
            <CardBody className="border-b border-slate-200">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Sold in {formatMonth(TODAY)}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                    {formatMoney(soldThisMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Target</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                    {target ? formatMoney(target.amount) : '—'}
                  </p>
                  {!target ? <p className="text-sm text-slate-500">No target set for this month</p> : null}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Achieved</p>
                  {percent === null ? (
                    <p className="mt-1 text-2xl font-extrabold text-slate-400">—</p>
                  ) : (
                    <>
                      <p
                        className={`mt-1 text-2xl font-extrabold tabular-nums ${
                          percent >= 100 ? 'text-emerald-700' : percent >= 75 ? 'text-amber-700' : 'text-red-700'
                        }`}
                      >
                        {percent}%
                      </p>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            percent >= 100 ? 'bg-emerald-600' : percent >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardBody>
            <DataTable
              columns={saleColumns}
              rows={booked}
              onRowClick={(row) => navigate(`/sales/${row.id}`)}
              empty={{
                icon: ShoppingBag,
                title: 'No sales booked yet',
                message: 'Invoices recorded against this person will be listed here.',
              }}
            />
          </Card>
        ) : null}

        {/* ---------- what they delivered ---------- */}
        {employee.delivers ? (
          <Card>
            <CardHeader
              title="Deliveries made"
              subtitle="Invoices this person took out. Useful when a customer says an order never arrived."
            />
            <DataTable
              columns={saleColumns}
              rows={delivered}
              onRowClick={(row) => navigate(`/sales/${row.id}`)}
              empty={{
                icon: Truck,
                title: 'No deliveries yet',
                message: 'Deliveries recorded against this person will be listed here.',
              }}
            />
          </Card>
        ) : null}

        {/* ---------- record something ---------- */}
        {employee.status === 'active' ? (
          <Card>
            <CardHeader
              title="Record a payment, advance or adjustment"
              subtitle="A month does not have to be paid in one go, and money handed over early is tracked until it is taken back."
            />
            <CardBody>
              <form onSubmit={submit} className="grid max-w-3xl gap-5 sm:grid-cols-2">
                <Field label="What is this?" htmlFor="pay-kind" hint={KINDS.find((k) => k.value === kind).hint}>
                  <Select
                    id="pay-kind"
                    value={kind}
                    onChange={(event) => {
                      setKind(event.target.value)
                      setRecover('')
                    }}
                  >
                    {KINDS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label={kind === 'adjustment' ? 'Amount (minus for a deduction)' : 'Amount'}
                  htmlFor="pay-amount"
                  required
                  hint={
                    kind === 'salary'
                      ? `${formatMoney(pay.outstanding)} is still owed for this month.`
                      : kind === 'advance'
                        ? 'This leaves the cash box today.'
                        : 'Overtime as a plus, days not worked as a minus.'
                  }
                >
                  <NumberInput
                    id="pay-amount"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </Field>

                {kind === 'salary' && held > 0 ? (
                  <Field
                    label="Take back from advance"
                    htmlFor="pay-recover"
                    hint={`${formatMoney(held)} of advance is outstanding. This part is not handed over again.`}
                  >
                    <NumberInput
                      id="pay-recover"
                      step="0.01"
                      value={recover}
                      onChange={(event) => setRecover(event.target.value)}
                    />
                  </Field>
                ) : null}

                <Field label="Note" htmlFor="pay-note" hint="What this was for, in your own words.">
                  <TextInput id="pay-note" value={note} onChange={(event) => setNote(event.target.value)} />
                </Field>

                {amount !== '' && problem ? (
                  <div className="sm:col-span-2">
                    <InlineNote icon={AlertCircle}>{problem}</InlineNote>
                  </div>
                ) : null}

                {kind === 'salary' && amount !== '' && !problem ? (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 px-5 py-4 text-base text-slate-700">
                    Clears <strong>{formatMoney(Number(amount))}</strong> of the month.{' '}
                    <strong>{formatMoney(Number(amount) - (Number(recover) || 0))}</strong> leaves the cash box
                    {Number(recover) > 0 ? `, and ${formatMoney(Number(recover))} comes off the advance.` : '.'}
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <Button type="submit" icon={Wallet} size="lg" disabled={!canSubmit}>
                    Record it
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : null}

        {/* ---------- what has been paid ---------- */}
        <Card>
          <CardHeader
            title="Salary history"
            subtitle="Everything paid, advanced or adjusted for this person, newest first."
          />
          <DataTable
            columns={historyColumns}
            rows={history}
            empty={{
              icon: Wallet,
              title: 'Nothing recorded yet',
              message: 'Payments, advances and adjustments will be listed here.',
            }}
          />
        </Card>
      </PageBody>

      <ConfirmDialog
        open={confirmLeave}
        title={`Mark ${employee.name} as left?`}
        message="They come off the wage bill and can no longer be paid or picked on a new sale."
        detail="Nothing is deleted. Every invoice and delivery they handled keeps their name, and you can bring them back at any time."
        confirmLabel="Yes, they have left"
        cancelLabel="No, keep them"
        onConfirm={markLeft}
        onCancel={() => setConfirmLeave(false)}
      />
    </>
  )
}
