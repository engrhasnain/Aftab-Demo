import { useMemo, useState } from 'react'
import { CheckCircle2, Pencil, Plus, Users, Wallet } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import Badge from '../components/ui/Badge'
import Button, { LinkButton } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { InlineNote } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { salaryPaidThisMonth } from '../utils/selectors'
import { formatMonth, formatMoney, TODAY } from '../utils/format'

export default function Employees() {
  const data = useData()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [pendingEmployee, setPendingEmployee] = useState(null)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.employees
      .filter((employee) =>
        term
          ? [employee.name, employee.designation].some((field) => String(field).toLowerCase().includes(term))
          : true,
      )
      .map((employee) => ({ ...employee, paidThisMonth: salaryPaidThisMonth(data, employee.id) }))
  }, [data, search])

  const justAdded = data.lastCreated && data.lastCreated.type === 'employee' ? data.lastCreated.id : null
  const monthlyWageBill = data.employees.reduce((total, employee) => total + employee.monthlySalary, 0)
  const unpaidCount = rows.filter((row) => !row.paidThisMonth).length

  function confirmPayment() {
    const employee = pendingEmployee
    setPendingEmployee(null)
    if (!employee) return
    data.paySalary(employee.id, TODAY)
    showToast('Salary paid', {
      message: `${formatMoney(employee.monthlySalary)} recorded as money paid to ${employee.name}.`,
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          {row.name}
          {row.id === justAdded ? <Badge tone="green">Just added</Badge> : null}
        </span>
      ),
    },
    { key: 'designation', header: 'Designation', render: (row) => row.designation },
    {
      key: 'salary',
      header: 'Monthly salary',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums text-slate-900">{formatMoney(row.monthlySalary)}</span>,
    },
    {
      key: 'status',
      header: `${formatMonth(TODAY)} status`,
      render: (row) =>
        row.paidThisMonth ? (
          <Badge tone="green" icon={CheckCircle2}>
            Paid
          </Badge>
        ) : (
          <Badge tone="amber">Not paid yet</Badge>
        ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <span className="flex flex-wrap items-center justify-end gap-2">
          {row.paidThisMonth ? (
            <span className="text-base text-slate-500">Already paid</span>
          ) : (
            <Button icon={Wallet} onClick={() => setPendingEmployee(row)}>
              Record salary payment
            </Button>
          )}
          <LinkButton to={`/employees/${row.id}/edit`} variant="secondary" icon={Pencil}>
            Edit
          </LinkButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Your team and their monthly salaries."
        action={
          <LinkButton to="/employees/new" icon={Plus} size="lg">
            Add employee
          </LinkButton>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Employees</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{data.employees.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Monthly wage bill</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{formatMoney(monthlyWageBill)}</p>
          </div>
          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              unpaidCount ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-base font-semibold text-slate-600">Still to pay for {formatMonth(TODAY)}</p>
            <p className={`mt-2 text-3xl font-extrabold ${unpaidCount ? 'text-amber-900' : 'text-slate-900'}`}>
              {unpaidCount}
            </p>
          </div>
        </div>

        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="employee-search"
              label="Search by name or job title"
              value={search}
              onChange={setSearch}
              placeholder="e.g. Ahmed, or Driver…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            rowClassName={(row) => (row.id === justAdded ? 'bg-brand-50' : '')}
            empty={
              search
                ? {
                    icon: Users,
                    title: 'No employees match that search',
                    message: `Nothing found for "${search}".`,
                  }
                : {
                    icon: Users,
                    title: 'No employees yet',
                    message: 'Add your team members here so you can record their salary payments.',
                    action: (
                      <LinkButton to="/employees/new" icon={Plus} size="lg">
                        Add employee
                      </LinkButton>
                    ),
                  }
            }
          />
        </Card>

        <InlineNote icon={Wallet}>
          Recording a salary payment adds a “cash out” line to the cash ledger for that employee’s monthly salary.
        </InlineNote>
      </PageBody>

      <ConfirmDialog
        open={Boolean(pendingEmployee)}
        title="Record this salary payment?"
        message="This will record the money as paid and add it to the cash ledger."
        detail={
          pendingEmployee ? (
            <span>
              <span className="font-bold">{pendingEmployee.name}</span> — {pendingEmployee.designation}
              <br />
              Amount: <span className="font-bold">{formatMoney(pendingEmployee.monthlySalary)}</span> for{' '}
              {formatMonth(TODAY)}
            </span>
          ) : null
        }
        confirmLabel="Yes, record the payment"
        cancelLabel="No, go back"
        onConfirm={confirmPayment}
        onCancel={() => setPendingEmployee(null)}
      />
    </>
  )
}
