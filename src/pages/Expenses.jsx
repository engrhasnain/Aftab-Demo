import { useMemo, useState } from 'react'
import { ArrowDownRight, Info, Plus, Save, Wallet } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import RankBars from '../components/ui/RankBars'
import SearchInput from '../components/ui/SearchInput'
import ErrorSummary from '../components/ui/ErrorSummary'
import { Field, FormActions, InlineNote, NumberInput, Select, TextInput, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { EXPENSE_CATEGORIES } from '../data/seedData'
import { expenseTotalsByCategory, expensesNewestFirst } from '../utils/selectors'
import { formatDate, formatMoney, TODAY } from '../utils/format'
import { compactErrors, numberError } from '../utils/validation'

/**
 * Running costs that are neither stock nor salaries — rent, fuel, electricity.
 *
 * Without these the cash book is incomplete and the profit figure is only a
 * gross margin, because the costs of actually running the business never
 * appear anywhere.
 */
export default function Expenses() {
  const data = useData()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [values, setValues] = useState({
    date: TODAY,
    category: EXPENSE_CATEGORIES[0],
    payee: '',
    amount: '',
    note: '',
  })
  const [errors, setErrors] = useState({})

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return expensesNewestFirst(data).filter((expense) =>
      term
        ? [expense.category, expense.payee, expense.note].some((f) => String(f).toLowerCase().includes(term))
        : true,
    )
  }, [data, search])

  const total = rows.reduce((sum, expense) => sum + expense.amount, 0)
  const byCategory = expenseTotalsByCategory(data)
  const thisMonth = data.expenses
    .filter((e) => e.date.slice(0, 7) === TODAY.slice(0, 7))
    .reduce((sum, e) => sum + e.amount, 0)

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = compactErrors({
      date: values.date ? null : 'Please choose the date.',
      payee: values.payee.trim() ? null : 'Please say who was paid.',
      amount: numberError(values.amount, 'the amount'),
    })
    setErrors(next)
    if (Object.keys(next).length) return

    data.addExpense({
      date: values.date,
      category: values.category,
      payee: values.payee.trim(),
      amount: Number(values.amount),
      note: values.note.trim(),
    })
    showToast('Expense recorded', {
      message: `${formatMoney(Number(values.amount))} paid to ${values.payee.trim()} and added to the cash ledger.`,
    })
    setValues({ date: TODAY, category: EXPENSE_CATEGORIES[0], payee: '', amount: '', note: '' })
    setShowForm(false)
  }

  const problems = Object.entries(errors)
    .filter(([, m]) => Boolean(m))
    .map(([field, message]) => ({ id: `exp-${field}`, message }))

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Rent, fuel, electricity and everything else that is not stock or salary."
        action={
          <Button size="lg" icon={Plus} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close the form' : 'Add expense'}
          </Button>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Expenses recorded</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">{data.expenses.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Total paid out</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-red-700">
              {formatMoney(data.expenses.reduce((s, e) => s + e.amount, 0))}
            </p>
          </div>
          <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">This month</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">{formatMoney(thisMonth)}</p>
          </div>
        </div>

        {showForm ? (
          <Card className="max-w-3xl">
            <CardHeader title="New expense" subtitle="This pays money out and writes it into the cash ledger." />
            <CardBody>
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <ErrorSummary problems={problems} />

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Date" htmlFor="exp-date" required error={errors.date}>
                    <DateInput
                      id="exp-date"
                      value={values.date}
                      onChange={(event) => setField('date', event.target.value)}
                      error={errors.date}
                    />
                  </Field>

                  <Field label="What kind of cost" htmlFor="exp-category" required>
                    <Select
                      id="exp-category"
                      value={values.category}
                      onChange={(event) => setField('category', event.target.value)}
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Paid to" htmlFor="exp-payee" required error={errors.payee}>
                    <TextInput
                      id="exp-payee"
                      value={values.payee}
                      onChange={(event) => setField('payee', event.target.value)}
                      error={errors.payee}
                      placeholder="e.g. K-Electric"
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="Amount" htmlFor="exp-amount" required hint="Paisa allowed" error={errors.amount}>
                    <NumberInput
                      id="exp-amount"
                      min="0"
                      step="0.01"
                      value={values.amount}
                      onChange={(event) => setField('amount', event.target.value)}
                      error={errors.amount}
                      placeholder="0.00"
                    />
                  </Field>
                </div>

                <Field label="Note" htmlFor="exp-note" hint="Optional — a bill number or a few words.">
                  <TextInput
                    id="exp-note"
                    value={values.note}
                    onChange={(event) => setField('note', event.target.value)}
                    placeholder="e.g. June bill"
                    autoComplete="off"
                  />
                </Field>

                <InlineNote icon={Info}>
                  This will take the money out of cash straight away, the same as any other payment.
                </InlineNote>

                <FormActions>
                  <Button type="submit" size="lg" icon={Save}>
                    Save expense
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </FormActions>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardBody className="border-b border-slate-200">
              <SearchInput
                id="expense-search"
                label="Search by kind, who was paid, or the note"
                value={search}
                onChange={setSearch}
                placeholder="e.g. fuel, or K-Electric…"
              />
            </CardBody>
            <DataTable
              columns={[
                { key: 'code', header: 'Code', render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span> },
                {
                  key: 'date',
                  header: 'Date',
                  render: (row) => <span className="whitespace-nowrap font-semibold">{formatDate(row.date)}</span>,
                },
                { key: 'category', header: 'Kind', render: (row) => <Badge tone="slate">{row.category}</Badge> },
                {
                  key: 'payee',
                  header: 'Paid to',
                  render: (row) => (
                    <span>
                      <span className="block font-semibold text-slate-900">{row.payee}</span>
                      {row.note ? <span className="block text-sm text-slate-500">{row.note}</span> : null}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  render: (row) => (
                    <span className="font-bold tabular-nums text-red-700">−{formatMoney(row.amount)}</span>
                  ),
                },
              ]}
              rows={rows}
              empty={{
                icon: Wallet,
                title: search ? 'No expenses match that search' : 'No expenses recorded yet',
                message: search
                  ? 'Try a shorter word.'
                  : 'Record rent, fuel, electricity and anything else the business pays for.',
                action: search ? null : (
                  <Button size="lg" icon={Plus} onClick={() => setShowForm(true)}>
                    Add expense
                  </Button>
                ),
              }}
            />
            {rows.length ? (
              <div className="border-t border-slate-200 px-6 py-4 text-base text-slate-600">
                {rows.length} expense{rows.length === 1 ? '' : 's'} shown, totalling{' '}
                <span className="font-bold text-slate-900">{formatMoney(total)}</span>.
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader icon={ArrowDownRight} title="Where the money goes" subtitle="All expenses by kind." />
            <RankBars rows={byCategory} emptyText="Nothing recorded yet." />
          </Card>
        </div>

        <InlineNote icon={Info}>
          These costs come out of the profit you make on stock. Until they are recorded here, the profit figure on the
          Reports screen is only the margin on goods, not what the business actually keeps.
        </InlineNote>
      </PageBody>
    </>
  )
}
