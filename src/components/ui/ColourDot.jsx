/**
 * The colour a supplier or product has been given, shown as a small solid dot.
 * Staff recognise a principal company by its colour long before they finish
 * reading the name, which is the whole point of the tag.
 */
export default function ColourDot({ colour, size = 12, className = '' }) {
  if (!colour) return null
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/10 ${className}`}
      style={{ width: size, height: size, background: colour }}
      aria-hidden="true"
    />
  )
}

/** The choices offered when tagging a record. */
export const COLOUR_CHOICES = [
  '#2A3785', '#3B4CA4', '#0F766E', '#0E7490',
  '#15803D', '#A16207', '#B45309', '#BE123C',
  '#9E2C20', '#7C3AED', '#BE185D', '#475569',
]

export function ColourPicker({ value, onChange, id }) {
  return (
    <div className="flex flex-wrap gap-2" id={id} role="radiogroup" aria-label="Colour">
      {COLOUR_CHOICES.map((colour) => {
        const selected = value === colour
        return (
          <button
            key={colour}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={colour}
            onClick={() => onChange(colour)}
            className={`h-10 w-10 rounded-xl ring-2 transition ${
              selected ? 'ring-slate-900 ring-offset-2' : 'ring-black/10 hover:ring-slate-400'
            }`}
            style={{ background: colour }}
          />
        )
      })}
    </div>
  )
}
