import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ErrorSummary from '../components/ui/ErrorSummary'
import UnsavedChangesGuard from '../components/ui/UnsavedChangesGuard'
import RecordNotFound from '../components/ui/RecordNotFound'
import { DateInput, Field, FormActions, NumberInput, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { getEmployee } from '../utils/selectors'
import { compactErrors, numberError } from '../utils/validation'
import { TODAY } from '../utils/format'

const LABELS = {
  name: 'Name',
  designation: 'Designation',
  monthlySalary: 'Monthly salary',
  phone: 'Phone number',
  cnic: 'CNIC',
  address: 'Address',
  joinedDate: 'Joined on',
}

/* The two duties decide who the sale screen offers as the person who took the
   order and the person who took the goods out. An accounts assistant should
   never turn up in either list. */
const DUTIES = [
  { field: 'booksSales', label: 'Takes orders from customers', hint: 'Appears in the “Booked by” list on a sale, and can be given a sales target.' },
  { field: 'delivers', label: 'Delivers goods', hint: 'Appears in the “Delivered by” list on a sale.' },
]

/** Handles both "add employee" and "edit employee". */
export default function EmployeeForm() {
  const { id } = useParams()
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const existing = id ? getEmployee(data, id) : null

  const [values, setValues] = useState(() => ({
    name: existing?.name || '',
    designation: existing?.designation || '',
    monthlySalary: existing ? String(existing.monthlySalary) : '',
    phone: existing?.phone || '',
    cnic: existing?.cnic || '',
    address: existing?.address || '',
    joinedDate: existing?.joinedDate || TODAY,
    booksSales: Boolean(existing?.booksSales),
    delivers: Boolean(existing?.delivers),
  }))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  if (id && !existing) {
    return <RecordNotFound title="Employee" backTo="/employees" backLabel="Back to employees" />
  }

  const dirty =
    !saved &&
    (existing
      ? values.name !== existing.name ||
        values.designation !== existing.designation ||
        Number(values.monthlySalary) !== existing.monthlySalary ||
        values.phone !== (existing.phone || '') ||
        values.cnic !== (existing.cnic || '') ||
        values.address !== (existing.address || '') ||
        values.joinedDate !== (existing.joinedDate || '') ||
        values.booksSales !== Boolean(existing.booksSales) ||
        values.delivers !== Boolean(existing.delivers)
      : values.name.trim() !== '' ||
        values.designation.trim() !== '' ||
        values.monthlySalary !== '' ||
        values.phone.trim() !== '' ||
        values.cnic.trim() !== '' ||
        values.address.trim() !== '' ||
        values.booksSales ||
        values.delivers)

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const phone = values.phone.trim()
    const cnic = values.cnic.trim()

    const next = compactErrors({
      name: values.name.trim() ? null : 'Please enter the employee’s name.',
      designation: values.designation.trim() ? null : 'Please enter their job title.',
      monthlySalary: numberError(values.monthlySalary, 'the monthly salary'),
      phone: !phone
        ? 'Please enter a phone number.'
        : !/^[0-9+\-\s()]+$/.test(phone)
          ? 'Use digits only, with - + ( ) or spaces if needed.'
          : phone.replace(/\D/g, '').length < 7
            ? 'That number looks too short.'
            : null,
      // Optional, but if it is filled in it has to be a real CNIC.
      cnic: !cnic
        ? null
        : /^\d{5}-\d{7}-\d$/.test(cnic)
          ? null
          : 'A CNIC looks like 42101-1234567-5.',
      joinedDate: values.joinedDate ? null : 'Please give the date they joined.',
    })
    setErrors(next)
    if (Object.keys(next).length) return

    const name = values.name.trim()
    const payload = {
      name,
      designation: values.designation.trim(),
      monthlySalary: values.monthlySalary,
      phone: values.phone.trim(),
      cnic: values.cnic.trim(),
      address: values.address.trim(),
      joinedDate: values.joinedDate,
      booksSales: values.booksSales,
      delivers: values.delivers,
    }

    setSaved(true)

    if (existing) {
      data.updateEmployee({ id: existing.id, ...payload })
      showToast('Changes saved', { message: `${name}'s details have been updated.` })
    } else {
      data.addEmployee(payload)
      showToast('Employee saved', { message: `${name} has been added to your team.` })
    }
    navigate(existing ? `/employees/${existing.id}` : '/employees')
  }

  const problems = Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => ({ id: field, message: `${LABELS[field]} — ${message}` }))

  return (
    <>
      <UnsavedChangesGuard when={dirty} />
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add employee'}
        subtitle={existing ? 'Correct any detail and save.' : 'Add a member of your team, what they are paid, and what they do.'}
        back={{ to: '/employees', label: 'Back to employees' }}
      />

      <PageBody>
        <Card className="max-w-2xl">
          <CardHeader
            title={existing ? 'Employee details' : 'New employee details'}
            subtitle="Fields marked with * are required."
          />
          <CardBody>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <ErrorSummary problems={problems} />

              <Field label="Name" htmlFor="name" required error={errors.name}>
                <TextInput
                  id="name"
                  value={values.name}
                  onChange={(event) => setField('name', event.target.value)}
                  error={errors.name}
                  placeholder="e.g. Ahmed Khan"
                  autoComplete="off"
                />
              </Field>

              <Field label="Designation" htmlFor="designation" required hint="Their job title" error={errors.designation}>
                <TextInput
                  id="designation"
                  value={values.designation}
                  onChange={(event) => setField('designation', event.target.value)}
                  error={errors.designation}
                  placeholder="e.g. Sales Officer"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Monthly salary"
                htmlFor="monthlySalary"
                required
                hint="In Pakistani Rupees, per month"
                error={errors.monthlySalary}
              >
                <NumberInput
                  id="monthlySalary"
                  min="0"
                  step="500"
                  value={values.monthlySalary}
                  onChange={(event) => setField('monthlySalary', event.target.value)}
                  error={errors.monthlySalary}
                  placeholder="0"
                />
              </Field>

              <Field
                label="Phone number"
                htmlFor="phone"
                required
                hint="How you reach them"
                error={errors.phone}
              >
                <TextInput
                  id="phone"
                  value={values.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  error={errors.phone}
                  placeholder="e.g. 0300-1234567"
                  inputMode="tel"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="CNIC"
                htmlFor="cnic"
                hint="Optional, but needed for salary records and any tax filing"
                error={errors.cnic}
              >
                <TextInput
                  id="cnic"
                  value={values.cnic}
                  onChange={(event) => setField('cnic', event.target.value)}
                  error={errors.cnic}
                  placeholder="42101-1234567-5"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>

              <Field label="Address" htmlFor="address" hint="Where they live" error={errors.address}>
                <TextInput
                  id="address"
                  value={values.address}
                  onChange={(event) => setField('address', event.target.value)}
                  error={errors.address}
                  placeholder="e.g. House 14, Block 6, PECHS, Karachi"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Joined on"
                htmlFor="joinedDate"
                required
                hint="The day they started with you"
                error={errors.joinedDate}
              >
                <DateInput
                  id="joinedDate"
                  value={values.joinedDate}
                  onChange={(event) => setField('joinedDate', event.target.value)}
                  error={errors.joinedDate}
                  max={TODAY}
                />
              </Field>

              <fieldset className="rounded-2xl border border-slate-200 p-5">
                <legend className="px-2 text-base font-bold text-slate-800">What do they do?</legend>
                <p className="mb-4 text-base text-slate-600">
                  Tick these and their name starts appearing on the sale screen. Leave both empty for office and
                  warehouse staff.
                </p>
                <div className="space-y-4">
                  {DUTIES.map((duty) => (
                    <label
                      key={duty.field}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0"
                        checked={values[duty.field]}
                        onChange={(event) => setField(duty.field, event.target.checked)}
                      />
                      <span>
                        <span className="block text-base font-semibold text-slate-900">{duty.label}</span>
                        <span className="block text-base text-slate-600">{duty.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <FormActions>
                <Button type="submit" size="lg" icon={Save}>
                  {existing ? 'Save changes' : 'Save employee'}
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={() => navigate('/employees')}>
                  Cancel
                </Button>
              </FormActions>
            </form>
          </CardBody>
        </Card>
      </PageBody>
    </>
  )
}
