import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import PartyForm from '../components/PartyForm'
import RecordNotFound from '../components/ui/RecordNotFound'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { getSupplier } from '../utils/selectors'

/** Handles both "add supplier" and "edit supplier" — the fields are identical. */
export default function SupplierForm() {
  const { id } = useParams()
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const existing = id ? getSupplier(data, id) : null
  if (id && !existing) {
    return <RecordNotFound title="Supplier" backTo="/suppliers" backLabel="Back to suppliers" />
  }

  function handleSave(supplier) {
    if (existing) {
      data.updateSupplier({ id: existing.id, ...supplier })
      showToast('Changes saved', { message: `${supplier.name} has been updated.` })
      navigate(`/suppliers/${existing.id}`)
    } else {
      data.addSupplier(supplier)
      showToast('Supplier saved', { message: `${supplier.name} has been added to your suppliers.` })
      navigate('/suppliers')
    }
  }

  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add supplier'}
        subtitle={existing ? 'Correct any detail and save.' : 'Add a company you buy products from.'}
        back={
          existing
            ? { to: `/suppliers/${existing.id}`, label: 'Back to supplier' }
            : { to: '/suppliers', label: 'Back to suppliers' }
        }
      />
      <PageBody>
        <PartyForm
          kind="supplier"
          backTo={existing ? `/suppliers/${existing.id}` : '/suppliers'}
          onSave={handleSave}
          initial={existing}
        />
      </PageBody>
    </>
  )
}
