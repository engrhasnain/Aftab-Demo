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
import { Field, FormActions, NumberInput, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { getEmployee } from '../utils/selectors'
import { compactErrors, numberError } from '../utils/validation'

const LABELS = { name: 'Name', designation: 'Designation', monthlySalary: 'Monthly salary' }

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
        Number(values.monthlySalary) !== existing.monthlySalary
      : Object.values(values).some((value) => value.trim() !== ''))

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const next = compactErrors({
      name: values.name.trim() ? null : 'Please enter the employee’s name.',
      designation: values.designation.trim() ? null : 'Please enter their job title.',
      monthlySalary: numberError(values.monthlySalary, 'the monthly salary'),
    })
    setErrors(next)
    if (Object.keys(next).length) return

    const name = values.name.trim()
    const payload = {
      name,
      designation: values.designation.trim(),
      monthlySalary: values.monthlySalary,
    }

    setSaved(true)

    if (existing) {
      data.updateEmployee({ id: existing.id, ...payload })
      showToast('Changes saved', { message: `${name}'s details have been updated.` })
    } else {
      data.addEmployee(payload)
      showToast('Employee saved', { message: `${name} has been added to your team.` })
    }
    navigate('/employees')
  }

  const problems = Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => ({ id: field, message: `${LABELS[field]} — ${message}` }))

  return (
    <>
      <UnsavedChangesGuard when={dirty} />
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add employee'}
        subtitle={existing ? 'Correct any detail and save.' : 'Add a member of your team and their monthly salary.'}
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
