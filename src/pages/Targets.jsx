import { useMemo, useState } from 'react'
import { CheckCircle2, Info, Save, Trash2 } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { Field, FormActions, InlineNote, NumberInput, Select, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { activeSales, getEmployee } from '../utils/selectors'
import { formatMoney, formatMonth, roundMoney, TODAY } from '../utils/format'

/**
 * Sales targets — the legacy "Targets Entry" screen.
 *
 * A target only earns its place if it is shown against the real figure, so each
 * row carries what was actually sold that month and how far along it is.
 */
export default function Targets() {
  const data = useData()
  const { showToast } = useToast()
  const [month, setMonth] = useState(TODAY.slice(0, 7))
  const [form, setForm] = useState({ scope: 'company', employeeId: '', amount: '', note: '' })

  /* What was actually sold in a month, company-wide. */
  const soldInMonth = useMemo(() => {
    const totals = new Map()
    for (const sale of activeSales(data)) {
      const key = sale.saleDate.slice(0, 7)
      totals.set(key, roundMoney((totals.get(key) || 0) + sale.totalAmount))
    }
    return totals
  }, [data])

  const rows = useMemo(
    () =>
      [...data.targets]
        .sort((a, b) => (a.month === b.month ? a.scope.localeCompare(b.scope) : a.month < b.month ? 1 : -1))
        .map((target) => {
          // The company figure is real. A person's share of it is not tracked
          // per salesperson yet, so their achievement is shown as unknown
          // rather than invented.
          const actual = target.scope === 'company' ? soldInMonth.get(target.month) || 0 : null
          const percent = actual !== null && target.amount ? Math.round((actual / target.amount) * 100) : null
          return {
            ...target,
            employeeName: target.employeeId ? (getEmployee(data, target.employeeId) || {}).name : null,
            actual,
            percent,
          }
        }),
    [data, soldInMonth],
  )

  const thisMonth = rows.find((r) => r.month === month && r.scope === 'company')

  function save(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    if (form.scope === 'employee' && !form.employeeId) return
    data.saveTarget({
      month,
      scope: form.scope,
      employeeId: form.scope === 'employee' ? form.employeeId : null,
      amount,
      note: form.note.trim(),
    })
    showToast('Target saved', { message: `${formatMonth(month + '-01')} — ${formatMoney(amount)}` })
    setForm({ scope: 'company', employeeId: '', amount: '', note: '' })
  }

  return (
    <>
      <PageHeader title="Targets" subtitle="What the business is aiming for each month, against what it actually did." />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Target for {formatMonth(month + '-01')}
            </p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
              {thisMonth ? formatMoney(thisMonth.amount) : 'Not set'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Actually sold</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
              {formatMoney(soldInMonth.get(month) || 0)}
            </p>
          </div>
          <div
            className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${
              thisMonth && thisMonth.percent >= 100 ? 'border-l-4 border-l-emerald-600' : 'border-l-4 border-l-amber-500'
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">How far along</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
              {thisMonth && thisMonth.percent !== null ? `${thisMonth.percent}%` : '—'}
            </p>
          </div>
        </div>

        <Card className="max-w-3xl">
          <CardHeader title="Set a target" subtitle="For the whole business, or for one member of the team." />
          <CardBody>
            <form onSubmit={save} noValidate className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Month" htmlFor="tgt-month" required>
                  <input
                    id="tgt-month"
                    type="month"
                    className="field-input"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                  />
                </Field>
                <Field label="Target for" htmlFor="tgt-scope" required>
                  <Select
                    id="tgt-scope"
                    value={form.scope}
                    onChange={(event) => setForm((f) => ({ ...f, scope: event.target.value }))}
                  >
                    <option value="company">The whole business</option>
                    <option value="employee">One member of the team</option>
                  </Select>
                </Field>
              </div>

              {form.scope === 'employee' ? (
                <Field label="Who" htmlFor="tgt-who" required>
                  <Select
                    id="tgt-who"
                    value={form.employeeId}
                    onChange={(event) => setForm((f) => ({ ...f, employeeId: event.target.value }))}
                  >
                    <option value="">Choose someone…</option>
                    {data.employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} — {employee.designation}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Target amount" htmlFor="tgt-amount" required hint="Sales value for the month">
                  <NumberInput
                    id="tgt-amount"
                    min="0"
                    step="1000"
                    value={form.amount}
                    onChange={(event) => setForm((f) => ({ ...f, amount: event.target.value }))}
                    placeholder="0"
                  />
                </Field>
                <Field label="Note" htmlFor="tgt-note">
                  <TextInput
                    id="tgt-note"
                    value={form.note}
                    onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
                    placeholder="e.g. Peak season"
                    autoComplete="off"
                  />
                </Field>
              </div>

              <InlineNote icon={Info}>
                Setting a target for a month that already has one simply replaces it.
              </InlineNote>

              <FormActions>
                <Button type="submit" size="lg" icon={Save}>
                  Save target
                </Button>
              </FormActions>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Targets and results" subtitle="Newest month first." />
          <DataTable
            columns={[
              { key: 'month', header: 'Month', render: (r) => <span className="whitespace-nowrap font-semibold">{formatMonth(r.month + '-01')}</span> },
              {
                key: 'scope',
                header: 'For',
                render: (r) =>
                  r.scope === 'company' ? (
                    <Badge tone="blue">Whole business</Badge>
                  ) : (
                    <span className="font-semibold text-slate-900">{r.employeeName || 'Unknown'}</span>
                  ),
              },
              { key: 'amount', header: 'Target', align: 'right', render: (r) => <span className="tabular-nums">{formatMoney(r.amount)}</span> },
              {
                key: 'actual',
                header: 'Actually sold',
                align: 'right',
                render: (r) =>
                  r.actual === null ? (
                    <span className="text-slate-400">Not tracked per person yet</span>
                  ) : (
                    <span className="font-bold tabular-nums">{formatMoney(r.actual)}</span>
                  ),
              },
              {
                key: 'progress',
                header: 'How far along',
                render: (r) =>
                  r.percent === null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span className="h-3 w-28 overflow-hidden rounded-sm bg-slate-100">
                        <span
                          className={`block h-full rounded-sm ${r.percent >= 100 ? 'bg-emerald-600' : 'bg-[#3B4CA4]'}`}
                          style={{ width: `${Math.min(r.percent, 100)}%` }}
                        />
                      </span>
                      <span className="w-14 text-right font-bold tabular-nums">{r.percent}%</span>
                      {r.percent >= 100 ? (
                        <CheckCircle2 size={18} className="text-emerald-600" aria-hidden="true" />
                      ) : null}
                    </span>
                  ),
              },
              {
                key: 'action',
                header: 'Action',
                align: 'right',
                render: (r) => (
                  <Button
                    variant="secondary"
                    icon={Trash2}
                    onClick={(event) => {
                      event.stopPropagation()
                      data.deleteTarget(r.id)
                      showToast('Target removed', { message: `${formatMonth(r.month + '-01')} target deleted.` })
                    }}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
            rows={rows}
            empty={{ title: 'No targets set', message: 'Set a monthly target and it will be tracked against real sales.' }}
          />
        </Card>

        <InlineNote icon={Info}>
          Company targets are measured against real sales. Per-person targets are recorded, but the system does not yet
          know which salesperson made each sale — that needs a salesperson on the sale, which is a small change to the
          sale screen.
        </InlineNote>
      </PageBody>
    </>
  )
}
