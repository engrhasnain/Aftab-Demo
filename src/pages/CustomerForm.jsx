import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import PartyForm from '../components/PartyForm'
import RecordNotFound from '../components/ui/RecordNotFound'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { getCustomer } from '../utils/selectors'

/** Handles both "add customer" and "edit customer". */
export default function CustomerForm() {
  const { id } = useParams()
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const existing = id ? getCustomer(data, id) : null
  if (id && !existing) {
    return <RecordNotFound title="Customer" backTo="/customers" backLabel="Back to customers" />
  }

  function handleSave(customer) {
    if (existing) {
      data.updateCustomer({ id: existing.id, ...customer })
      showToast('Changes saved', { message: `${customer.name} has been updated.` })
      navigate(`/customers/${existing.id}`)
    } else {
      data.addCustomer(customer)
      showToast('Customer saved', { message: `${customer.name} has been added to your customers.` })
      navigate('/customers')
    }
  }

  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add customer'}
        subtitle={existing ? 'Correct any detail and save.' : 'Add a shop or store you sell products to.'}
        back={
          existing
            ? { to: `/customers/${existing.id}`, label: 'Back to customer' }
            : { to: '/customers', label: 'Back to customers' }
        }
      />
      <PageBody>
        <PartyForm
          kind="customer"
          backTo={existing ? `/customers/${existing.id}` : '/customers'}
          onSave={handleSave}
          initial={existing}
        />
      </PageBody>
    </>
  )
}
