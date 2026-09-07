import { useState } from 'react'
import { Check, Info, Refresh, Save } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Field, InlineNote, NumberInput, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { FONT_SCALES, LANGUAGES, useT } from '../i18n'
import { TAX_MODES, calcLine } from '../utils/tax'
import { formatMoney } from '../utils/format'
import THEMES, { SECTION_ORDER } from '../utils/sectionTheme'

/**
 * Everything the business controls itself.
 *
 * Tax in particular is a setting, not something written into the code: the mode
 * and the rate are chosen here, each product can override the rate or be marked
 * untaxed, and changing any of it affects new documents only.
 */
export default function Settings() {
  const data = useData()
  const { t } = useT()
  const { showToast } = useToast()
  const [businessName, setBusinessName] = useState(data.settings.businessName)
  const [rate, setRate] = useState(String(data.settings.defaultTaxPercent))
  const [further, setFurther] = useState(String(data.settings.furtherTaxPercent))
  const [confirmReset, setConfirmReset] = useState(false)

  const { settings } = data

  function pickMode(id) {
    data.updateSettings({ taxMode: id })
    showToast(t('set.taxChanged'), { message: t('set.taxChanged.msg') })
  }

  function saveFurther() {
    const value = Number(further)
    if (!Number.isFinite(value) || value < 0 || value > 100) return
    data.updateSettings({ furtherTaxPercent: value })
    showToast(t('set.savedFurther'), { message: `${value}%` })
  }

  function saveRate() {
    const value = Number(rate)
    if (!Number.isFinite(value) || value < 0 || value > 100) return
    data.updateSettings({ defaultTaxPercent: value })
    showToast(t('set.savedRate'), { message: `${value}%` })
  }

  /* A worked example so the choice is visible rather than theoretical. */
  const example = calcLine(
    { qty: 10, bonusQty: 0, unitPrice: 855, mrp: 950, taxable: true, taxPercent: Number(rate) || 0 },
    settings,
  )

  return (
    <>
      <PageHeader title={t('nav.settings')} subtitle={t('set.subtitle')} />

      <PageBody>
        <Card className="max-w-4xl">
          <CardHeader title={t('set.business')} />
          <CardBody className="space-y-5">
            <Field label={t('set.businessName')} htmlFor="businessName" hint={t('set.businessName.hint')}>
              <TextInput
                id="businessName"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                onBlur={() => data.updateSettings({ businessName: businessName.trim() || settings.businessName })}
              />
            </Field>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader
            title={t('set.salesTax')}
            subtitle={t('set.salesTax.sub')}
          />
          <CardBody className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {TAX_MODES.map((mode) => {
                const selected = settings.taxMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => pickMode(mode.id)}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      selected
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-slate-900">{t(mode.labelKey, mode.label)}</span>
                      {selected ? (
                        <Check size={22} className="shrink-0 text-brand-700" aria-hidden="true" />
                      ) : null}
                    </span>
                    <span className="mt-1.5 block text-base text-slate-600">{t(mode.helpKey, mode.help)}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label={t('set.standardRate')}
                htmlFor="rate"
                hint={t('set.standardRate.hint')}
              >
                <div className="flex gap-3">
                  <NumberInput
                    id="rate"
                    min="0"
                    max="100"
                    step="0.01"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                  />
                  <Button icon={Save} onClick={saveRate}>
                    Save
                  </Button>
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: true, label: t('set.furtherOn'), help: t('set.furtherOn.help') },
                { value: false, label: t('set.furtherOff'), help: t('set.furtherOff.help') },
              ].map((choice) => {
                const selected = Boolean(settings.furtherTaxEnabled) === choice.value
                return (
                  <button
                    key={String(choice.value)}
                    type="button"
                    onClick={() => data.updateSettings({ furtherTaxEnabled: choice.value })}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      selected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-slate-900">{choice.label}</span>
                      {selected ? <Check size={22} className="text-brand-700" aria-hidden="true" /> : null}
                    </span>
                    <span className="mt-1.5 block text-base text-slate-600">{choice.help}</span>
                  </button>
                )
              })}
            </div>

            {settings.furtherTaxEnabled ? (
              <Field
                label={t('set.furtherRate')}
                htmlFor="further"
                hint={t('set.furtherRate.hint')}
              >
                <div className="flex gap-3 sm:max-w-xs">
                  <NumberInput
                    id="further"
                    min="0"
                    max="100"
                    step="0.01"
                    value={further}
                    onChange={(event) => setFurther(event.target.value)}
                  />
                  <Button icon={Save} onClick={saveFurther}>
                    Save
                  </Button>
                </div>
              </Field>
            ) : null}

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('set.example')}</p>
              <p className="mt-2 text-base text-slate-700">
                {t('set.example.line')} {formatMoney(950)}, {t('set.example.soldAt')} {formatMoney(855)}{' '}
                {t('set.example.each')} {Number(rate) || 0}%:
              </p>
              <dl className="mt-3 space-y-1.5 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">{t('set.goodsValue')}</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{formatMoney(example.value)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">{t('set.taxAmount')}</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{formatMoney(example.taxAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-300 pt-1.5">
                  <dt className="font-bold text-slate-900">{t('set.customerPays')}</dt>
                  <dd className="text-lg font-extrabold tabular-nums text-slate-900">
                    {formatMoney(example.lineTotal)}
                  </dd>
                </div>
              </dl>
              {settings.taxMode === 'inclusive-mrp' ? (
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {t('set.insideNote')}
                </p>
              ) : null}
            </div>

            <InlineNote icon={Info}>
              {t('set.taxFootnote')}
            </InlineNote>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader title={t('set.compliance')} subtitle={t('set.compliance.sub')} />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: true, label: t('set.block'), help: t('set.block.help') },
                { value: false, label: t('set.warn'), help: t('set.warn.help') },
              ].map((choice) => {
                const selected = Boolean(settings.blockExpiredLicence) === choice.value
                return (
                  <button
                    key={String(choice.value)}
                    type="button"
                    onClick={() => data.updateSettings({ blockExpiredLicence: choice.value })}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      selected
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-slate-900">{choice.label}</span>
                      {selected ? <Check size={22} className="text-brand-700" aria-hidden="true" /> : null}
                    </span>
                    <span className="mt-1.5 block text-base text-slate-600">{choice.help}</span>
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader title={t('set.langSize')} subtitle={t('set.langSize.sub')} />
          <CardBody className="space-y-6">
            <div>
              <p className="mb-2 text-base font-semibold text-slate-800">{t('set.language')}</p>
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map((language) => (
                  <Button
                    key={language.id}
                    size="lg"
                    variant={settings.language === language.id ? 'primary' : 'secondary'}
                    onClick={() => data.updateSettings({ language: language.id })}
                  >
                    {language.native}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {t('set.language.note')}
              </p>
            </div>

            <div>
              <p className="mb-2 text-base font-semibold text-slate-800">{t('set.textSize')}</p>
              <div className="flex flex-wrap gap-3">
                {FONT_SCALES.map((scale) => (
                  <Button
                    key={scale.id}
                    size="lg"
                    variant={settings.fontScale === scale.id ? 'primary' : 'secondary'}
                    onClick={() => data.updateSettings({ fontScale: scale.id })}
                  >
                    {t(scale.labelKey, scale.label)}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">{t('set.textSize.note')}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader
            title={t('set.colours')}
            subtitle={t('set.colours.sub')}
          />
          <CardBody>
            <ul className="grid gap-3 sm:grid-cols-2">
              {SECTION_ORDER.map((key) => {
                const entry = THEMES[key]
                return (
                  <li key={key} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-5 w-5 shrink-0 rounded-md ring-1 ring-black/10 ${entry.swatch}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-slate-900">{entry.label}</span>
                      <span className="block text-sm text-slate-600">{entry.meaning}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-base text-slate-700">
              There is only <b>one green</b> in the system — Sales — because green already means “money coming in”
              inside the pages. The cash box is <b>gold</b>, and <b>red</b> is kept for Compliance, so a red screen
              always means rules and safety.
            </p>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader
            title="Saved data"
            subtitle="What you enter now stays in this browser, so a refresh no longer wipes it."
          />
          <CardBody className="space-y-4">
            <p className="text-base text-slate-700">
              Everything you add is kept on this computer, in this browser only. Nobody else can see it and it does
              not travel between machines — that is what a real server would do.
            </p>
            <Button variant="secondary" icon={Refresh} onClick={() => setConfirmReset(true)}>
              Reset back to the demo data
            </Button>
          </CardBody>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader title={t('set.codes')} subtitle={t('set.codes.sub')} />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Products', settings.codeSeries.product, data.products],
                ['Suppliers', settings.codeSeries.supplier, data.suppliers],
                ['Customers', settings.codeSeries.customer, data.customers],
                ['Employees', settings.codeSeries.employee, data.employees],
                ['Expenses', settings.codeSeries.expense, data.expenses],
              ].map(([label, start, list]) => {
                const highest = list.reduce((max, item) => Math.max(max, Number(item.code) || 0), Number(start) - 1)
                return (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <dt className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-1 text-base text-slate-700">
                      {t('set.startsAt')} <span className="font-bold tabular-nums">{start}</span> ·{' '}
                      {t('set.nextWillBe')}{' '}
                      <Badge tone="blue">{highest + 1}</Badge>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </CardBody>
        </Card>
      </PageBody>

      <ConfirmDialog
        open={confirmReset}
        title="Put the demo data back?"
        message="Everything you have added or changed in this browser will be removed, and the original demo figures will return."
        confirmLabel="Yes, reset it"
        cancelLabel="No, keep my data"
        onConfirm={() => {
          setConfirmReset(false)
          data.resetAll()
          showToast('Demo data restored', { message: 'Everything is back to the starting figures.' })
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
