import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Info, Plus, Save } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ComboBox from '../components/ui/ComboBox'
import ErrorSummary from '../components/ui/ErrorSummary'
import { Field, FormActions, InlineNote, NumberInput, Select, TextInput, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { formatDate, formatMoney, roundMoney } from '../utils/format'
import { compactErrors, numberError } from '../utils/validation'
import { TODAY } from '../utils/format'

/**
 * Investors — the people whose money is in the business.
 *
 * Capital put in and drawings taken out are real cash movements, so they sit in
 * the same ledger as everything else rather than in a side note. Without this,
 * "cash in hand" quietly disagrees with the bank.
 */
export default function Investors() {
  const data = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(null) // 'investor' | 'entry' | null
  const [inv, setInv] = useState({ name: '', role: 'Investor', contactNumber: '', joinedOn: TODAY, note: '' })
  const [entry, setEntry] = useState({ investorId: '', direction: 'in', amount: '', date: TODAY, note: '' })
  const [errors, setErrors] = useState({})

  const rows = useMemo(
    () =>
      data.investors.map((investor) => {
        const entries = data.investorEntries.filter((e) => e.investorId === investor.id)
        const put = entries.filter((e) => e.direction === 'in').reduce((t, e) => t + e.amount, 0)
        const took = entries.filter((e) => e.direction === 'out').reduce((t, e) => t + e.amount, 0)
        return { ...investor, put: roundMoney(put), took: roundMoney(took), net: roundMoney(put - took), entries: entries.length }
      }),
    [data],
  )

  const totalIn = roundMoney(rows.reduce((t, r) => t + r.put, 0))
  const totalOut = roundMoney(rows.reduce((t, r) => t + r.took, 0))

  const ledger = useMemo(
    () =>
      [...data.investorEntries]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((e) => ({ ...e, name: (data.investors.find((i) => i.id === e.investorId) || {}).name || '—' })),
    [data],
  )

  function saveInvestor(event) {
    event.preventDefault()
    const next = compactErrors({
      name: inv.name.trim() ? null : 'Please enter the name.',
      contactNumber: inv.contactNumber.trim() ? null : 'Please enter a contact number.',
    })
    setErrors(next)
    if (Object.keys(next).length) return
    data.addInvestor({ ...inv, name: inv.name.trim(), contactNumber: inv.contactNumber.trim() })
    showToast('Investor added', { message: `${inv.name.trim()} is now on the list.` })
    setInv({ name: '', role: 'Investor', contactNumber: '', joinedOn: TODAY, note: '' })
    setForm(null)
  }

  function saveEntry(event) {
    event.preventDefault()
    const next = compactErrors({
      investorId: entry.investorId ? null : 'Please choose the investor.',
      amount: numberError(entry.amount, 'the amount'),
    })
    setErrors(next)
    if (Object.keys(next).length) return
    data.recordInvestorEntry(entry)
    showToast(entry.direction === 'in' ? 'Capital recorded' : 'Drawings recorded', {
      message: `${formatMoney(Number(entry.amount))} ${entry.direction === 'in' ? 'added to' : 'taken out of'} cash.`,
    })
    setEntry({ investorId: '', direction: 'in', amount: '', date: TODAY, note: '' })
    setForm(null)
  }

  const problems = Object.entries(errors)
    .filter(([, m]) => Boolean(m))
    .map(([field, message]) => ({ id: `inv-${field}`, message }))

  return (
    <>
      <PageHeader
        title="Investors"
        subtitle="Whose money is in the business, and what has been put in or taken out."
        action={
          <>
            <Button variant="secondary" icon={Plus} onClick={() => setForm(form === 'investor' ? null : 'investor')}>
              Add investor
            </Button>
            <Button icon={Plus} onClick={() => setForm(form === 'entry' ? null : 'entry')}>
              Record money in or out
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border-l-4 border-l-emerald-600 border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Capital put in</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-emerald-700">{formatMoney(totalIn)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Drawings taken out</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-red-700">{formatMoney(totalOut)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Standing in the business</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
              {formatMoney(roundMoney(totalIn - totalOut))}
            </p>
          </div>
        </div>

        {form === 'investor' ? (
          <Card className="max-w-2xl">
            <CardHeader title="New investor" />
            <CardBody>
              <form onSubmit={saveInvestor} noValidate className="space-y-6">
                <ErrorSummary problems={problems} />
                <Field label="Name" htmlFor="inv-name" required error={errors.name}>
                  <TextInput
                    id="inv-name"
                    value={inv.name}
                    onChange={(e) => setInv((v) => ({ ...v, name: e.target.value }))}
                    error={errors.name}
                    autoComplete="off"
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Role" htmlFor="inv-role">
                    <Select
                      id="inv-role"
                      value={inv.role}
                      onChange={(e) => setInv((v) => ({ ...v, role: e.target.value }))}
                    >
                      {['Owner', 'Partner', 'Silent partner', 'Family investor', 'Investor'].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Contact number" htmlFor="inv-phone" required error={errors.contactNumber}>
                    <TextInput
                      id="inv-phone"
                      value={inv.contactNumber}
                      onChange={(e) => setInv((v) => ({ ...v, contactNumber: e.target.value }))}
                      error={errors.contactNumber}
                      inputMode="tel"
                      autoComplete="off"
                    />
                  </Field>
                </div>
                <FormActions>
                  <Button type="submit" size="lg" icon={Save}>
                    Save investor
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setForm(null)}>
                    Cancel
                  </Button>
                </FormActions>
              </form>
            </CardBody>
          </Card>
        ) : null}

        {form === 'entry' ? (
          <Card className="max-w-2xl">
            <CardHeader title="Money in or out" subtitle="This moves real cash, so it goes into the ledger." />
            <CardBody>
              <form onSubmit={saveEntry} noValidate className="space-y-6">
                <ErrorSummary problems={problems} />
                <Field label="Investor" htmlFor="inv-who" required error={errors.investorId}>
                  <ComboBox
                    id="inv-who"
                    value={entry.investorId}
                    onChange={(value) => setEntry((v) => ({ ...v, investorId: value }))}
                    error={errors.investorId}
                    placeholder="Choose an investor…"
                    options={data.investors.map((i) => ({ value: i.id, label: i.name, hint: i.role }))}
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-3">
                  <Field label="Which way" htmlFor="inv-dir" required>
                    <Select
                      id="inv-dir"
                      value={entry.direction}
                      onChange={(e) => setEntry((v) => ({ ...v, direction: e.target.value }))}
                    >
                      <option value="in">Money put in (capital)</option>
                      <option value="out">Money taken out (drawings)</option>
                    </Select>
                  </Field>
                  <Field label="Amount" htmlFor="inv-amt" required error={errors.amount}>
                    <NumberInput
                      id="inv-amt"
                      min="0"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => setEntry((v) => ({ ...v, amount: e.target.value }))}
                      error={errors.amount}
                    />
                  </Field>
                  <Field label="Date" htmlFor="inv-date" required>
                    <DateInput
                      id="inv-date"
                      value={entry.date}
                      onChange={(e) => setEntry((v) => ({ ...v, date: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Note" htmlFor="inv-note">
                  <TextInput
                    id="inv-note"
                    value={entry.note}
                    onChange={(e) => setEntry((v) => ({ ...v, note: e.target.value }))}
                    autoComplete="off"
                  />
                </Field>
                <InlineNote icon={Info}>
                  Capital increases the cash in hand; drawings reduce it. Both show in the cash ledger.
                </InlineNote>
                <FormActions>
                  <Button type="submit" size="lg" icon={Save}>
                    Save
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setForm(null)}>
                    Cancel
                  </Button>
                </FormActions>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Investors" subtitle="What each person has put in and taken out." />
          <DataTable
            columns={[
              { key: 'code', header: 'Code', render: (r) => <span className="tabular-nums text-slate-500">{r.code}</span> },
              { key: 'name', header: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              { key: 'role', header: 'Role', render: (r) => <Badge tone="slate">{r.role}</Badge> },
              { key: 'phone', header: 'Contact', render: (r) => <span className="tabular-nums">{r.contactNumber}</span> },
              { key: 'in', header: 'Put in', align: 'right', render: (r) => <span className="tabular-nums text-emerald-700">{formatMoney(r.put)}</span> },
              { key: 'out', header: 'Taken out', align: 'right', render: (r) => <span className="tabular-nums text-red-700">{formatMoney(r.took)}</span> },
              { key: 'net', header: 'Standing', align: 'right', render: (r) => <span className="font-bold tabular-nums">{formatMoney(r.net)}</span> },
            ]}
            rows={rows}
            empty={{ title: 'No investors yet', message: 'Add the people whose money is in the business.' }}
          />
        </Card>

        <Card>
          <CardHeader title="Capital movements" subtitle="Newest first. Every line is also in the cash ledger." />
          <DataTable
            columns={[
              { key: 'date', header: 'Date', render: (r) => <span className="whitespace-nowrap">{formatDate(r.date)}</span> },
              { key: 'name', header: 'Investor', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              {
                key: 'dir',
                header: 'Which way',
                render: (r) =>
                  r.direction === 'in' ? (
                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                      <ArrowUpRight size={16} aria-hidden="true" /> Capital in
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 font-semibold text-red-700">
                      <ArrowDownRight size={16} aria-hidden="true" /> Drawings
                    </span>
                  ),
              },
              { key: 'note', header: 'Note', render: (r) => r.note || '—' },
              {
                key: 'amt',
                header: 'Amount',
                align: 'right',
                render: (r) => (
                  <span className={`font-bold tabular-nums ${r.direction === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {r.direction === 'in' ? '+' : '−'}
                    {formatMoney(r.amount)}
                  </span>
                ),
              },
            ]}
            rows={ledger}
            empty={{ title: 'Nothing recorded yet', message: 'Capital put in or taken out will be listed here.' }}
          />
        </Card>
      </PageBody>
    </>
  )
}
