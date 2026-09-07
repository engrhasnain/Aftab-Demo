import { ChevronRight } from '../icons'
import EmptyState from './EmptyState'

/**
 * One table component for every list in the app so spacing, row height and
 * click behaviour stay identical everywhere.
 *
 * columns: [{ key, header, align, width, render(row), cellClassName }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  rowClassName,
  empty,
  footer,
}) {
  if (!rows.length) {
    return empty ? <EmptyState {...empty} /> : null
  }

  const clickable = Boolean(onRowClick)

  return (
    <div className="table-scroll">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-4 text-sm font-bold uppercase tracking-wide text-slate-600 ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                }`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
            {clickable ? <th scope="col" className="w-12 px-3 py-4" aria-label="Open" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              onClick={clickable ? () => onRowClick(row) : undefined}
              onKeyDown={
                clickable
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? 'button' : undefined}
              className={[
                'border-b border-slate-200 text-base text-slate-800',
                clickable ? 'cursor-pointer transition hover:bg-brand-50/60 focus:bg-brand-50' : '',
                rowClassName ? rowClassName(row) : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-4 align-middle ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                  } ${column.cellClassName || ''}`}
                >
                  {column.render(row)}
                </td>
              ))}
              {clickable ? (
                <td className="px-3 py-4 text-right text-slate-400">
                  <ChevronRight size={22} aria-hidden="true" />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
        {footer ? <tfoot>{footer}</tfoot> : null}
      </table>
    </div>
  )
}
