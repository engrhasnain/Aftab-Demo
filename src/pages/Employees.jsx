import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Plus, Users, Wallet } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import Badge from '../components/ui/Badge'
import Button, { LinkButton } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { advanceHeld, salaryStatus } from '../utils/selectors'
import { monthOf, wageBill } from '../utils/payroll'
import { formatMonth, formatMoney, TODAY } from '../utils/format'

const MONTH = monthOf(TODAY)

export default function Employees() {
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [showLeft, setShowLeft] = useState(false)
  const [pending, setPending] = useState(null)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.employees
      .filter((employee) => (showLeft ? true : employee.status !== 'left'))
      .filter((employee) =>
        term
          ? [employee.name, employee.designation, employee.phone, String(employee.code)].some((field) =>
              String(field || '').toLowerCase().includes(term),
            )
          : true,
      )
      .map((employee) => ({
        ...employee,
        pay: salaryStatus(data, employee.id, MONTH),
        advance: advanceHeld(data, employee.id),
      }))
  }, [data, search, showLeft])

  const justAdded = data.lastCreated && data.lastCreated.type === 'employee' ? data.lastCreated.id : null

  const active = data.employees.filter((e) => e.status !== 'left')
  const leftCount = data.employees.length - active.length
  const monthlyWageBill = wageBill(data.employees)

  const stillOwed = active.reduce((total, e) => total + salaryStatus(data, e.id, MONTH).outstanding, 0)
  const unpaidCount = active.filter((e) => salaryStatus(data, e.id, MONTH).outstanding > 0).length
  const advancesOut = data.employees.reduce((total, e) => total + advanceHeld(data, e.id), 0)

  /* The quick button on this screen settles whatever is left of the month in
     one go, because that is the common case. Part payments, advances and
     adjustments live on the person's own page, where there is room to explain
     them. */
  function confirmPayment() {
    const row = pending
    setPending(null)
    if (!row) return
    data.recordPayroll({
      employeeId: row.id,
      month: MONTH,
      kind: 'salary',
      amount: row.pay.outstanding,
      advanceRecovered: 0,
      note: row.pay.settled > 0 ? 'Balance of the month' : 'Paid in full',
      entryDate: TODAY,
    })
    showToast('Salary paid', {
      message: `${formatMoney(row.pay.outstanding)} recorded as money paid to ${row.name}.`,
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{row.name}</span>
          <span className="text-sm font-semibold tabular-nums text-slate-500">{row.code}</span>
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
          {row.status === 'left' ? <Badge tone="slate">Left</Badge> : null}
        </span>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.designation}
          {row.booksSales ? <Badge tone="blue">Books sales</Badge> : null}
          {row.delivers ? <Badge tone="violet">Delivers</Badge> : null}
        </span>
      ),
    },
    {
      key: 'salary',
      header: 'Monthly salary',
      align: 'right',
      render: (row) => (
        <span className="font-bold tabular-nums text-slate-900">{formatMoney(row.monthlySalary)}</span>
      ),
    },
    {
      key: 'status',
      header: `${formatMonth(TODAY)} status`,
      render: (row) => {
        if (row.status === 'left') return <span className="text-base text-slate-500">Not on payroll</span>
        if (row.pay.state === 'paid') {
          return (
            <Badge tone="green" icon={CheckCircle2}>
              Paid
            </Badge>
          )
        }
        if (row.pay.state === 'part') {
          return (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone="amber">Part paid</Badge>
              <span className="text-sm font-semibold tabular-nums text-slate-600">
                {formatMoney(row.pay.outstanding)} left
              </span>
            </span>
          )
        }
        return (
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">Not paid yet</Badge>
            {row.advance > 0 ? (
              <span className="text-sm font-semibold tabular-nums text-slate-600">
                holds {formatMoney(row.advance)} advance
              </span>
            ) : null}
          </span>
        )
      },
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <span className="flex flex-wrap items-center justify-end gap-2">
          {row.status !== 'left' && row.pay.outstanding > 0 ? (
            <Button
              icon={Wallet}
              onClick={(event) => {
                event.stopPropagation()
                setPending(row)
              }}
            >
              Pay {formatMoney(row.pay.outstanding)}
            </Button>
          ) : null}
          <LinkButton to={`/employees/${row.id}`} variant="secondary">
            Open
          </LinkButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Your team, what they are owed this month, and what they have sold."
        action={
          <LinkButton to="/employees/new" icon={Plus} size="lg">
            Add employee
          </LinkButton>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">On the team</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{active.length}</p>
            {leftCount ? (
              <p className="mt-1 text-sm text-slate-500">
                {leftCount} {leftCount === 1 ? 'person has' : 'people have'} left
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Monthly wage bill</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{formatMoney(monthlyWageBill)}</p>
            <p className="mt-1 text-sm text-slate-500">Before overtime or deductions</p>
          </div>

          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              stillOwed > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-base font-semibold text-slate-600">Still to pay for {formatMonth(TODAY)}</p>
            <p className={`mt-2 text-3xl font-extrabold ${stillOwed > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {formatMoney(stillOwed)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {unpaidCount} {unpaidCount === 1 ? 'person' : 'people'}
            </p>
          </div>

          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              advancesOut > 0 ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-base font-semibold text-slate-600">Advances outstanding</p>
            <p className={`mt-2 text-3xl font-extrabold ${advancesOut > 0 ? 'text-sky-900' : 'text-slate-900'}`}>
              {formatMoney(advancesOut)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Given early, still to be taken back</p>
          </div>
        </div>

        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="employee-search"
              label="Search by name, job title, code or phone number"
              value={search}
              onChange={setSearch}
              placeholder="Try “driver”, “Ahmed” or 9004"
            />
            {leftCount ? (
              <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={showLeft}
                  onChange={(event) => setShowLeft(event.target.checked)}
                />
                Also show people who have left
              </label>
            ) : null}
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/employees/${row.id}`)}
            rowClassName={(row) =>
              [row.id === justAdded ? 'bg-purple-50' : '', row.status === 'left' ? 'opacity-60' : '']
                .filter(Boolean)
                .join(' ')
            }
            empty={{
              icon: Users,
              title: search ? 'Nobody matches that' : 'No employees yet',
              message: search
                ? 'Try part of a name, a job title or their code.'
                : 'Add your first employee to start keeping salaries here.',
            }}
          />
        </Card>
      </PageBody>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? `Pay ${pending.name}?` : ''}
        message={
          pending
            ? `${formatMoney(pending.pay.outstanding)} will be recorded as money paid out of the cash box for ${formatMonth(
                TODAY,
              )}.`
            : ''
        }
        confirmLabel="Yes, record the payment"
        cancelLabel="Not now"
        onConfirm={confirmPayment}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
