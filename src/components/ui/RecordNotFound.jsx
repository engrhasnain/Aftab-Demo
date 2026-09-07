import { SearchX } from '../icons'
import PageHeader from './PageHeader'
import EmptyState from './EmptyState'
import { LinkButton } from './Button'
import { PageBody } from '../Layout'
import Card from './Card'

export default function RecordNotFound({ title = 'Not found', backTo, backLabel }) {
  return (
    <>
      <PageHeader title={title} back={{ to: backTo, label: backLabel }} />
      <PageBody>
        <Card>
          <EmptyState
            icon={SearchX}
            title="We could not find that record"
            message="It may have been removed, or the link may be wrong."
            action={
              <LinkButton to={backTo} size="lg">
                {backLabel}
              </LinkButton>
            }
          />
        </Card>
      </PageBody>
    </>
  )
}
