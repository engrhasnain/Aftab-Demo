import { createContext, useContext, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'

/**
 * Language and text size.
 *
 * Screens ask for text by key instead of writing English into the markup, so a
 * new language is a column in the dictionary rather than a change to every
 * screen. Urdu is right-to-left, so choosing it flips the whole layout too.
 *
 * Anything not yet translated falls back to English — and the stylesheet gives
 * those strings `unicode-bidi: plaintext` so an English sentence inside an Urdu
 * page still reads left-to-right with its full stop in the right place.
 */

export const DICTIONARY = {
  /* ---- navigation ---- */
  'nav.dashboard': ['Dashboard', 'ڈیش بورڈ'],
  'nav.suppliers': ['Suppliers', 'سپلائر'],
  'nav.products': ['Products', 'پروڈکٹس'],
  'nav.customers': ['Customers', 'گاہک'],
  'nav.purchases': ['Purchases', 'خریداری'],
  'nav.sales': ['Sales', 'فروخت'],
  'nav.stock': ['Stock', 'اسٹاک'],
  'nav.cash': ['Cash ledger', 'کیش لیجر'],
  'nav.moneyOwed': ['Money owed', 'واجب الادا رقم'],
  'nav.offers': ['Offers', 'آفرز'],
  'nav.returns': ['Returns', 'واپسی'],
  'nav.investors': ['Investors', 'سرمایہ کار'],
  'nav.targets': ['Targets', 'اہداف'],
  'nav.expenses': ['Expenses', 'اخراجات'],
  'nav.reports': ['Reports', 'رپورٹس'],
  'nav.employees': ['Employees', 'ملازمین'],
  'nav.compliance': ['Compliance', 'ضوابط'],
  'nav.openings': ['Openings', 'ابتدائی اندراج'],
  'nav.settings': ['Settings', 'ترتیبات'],

  /* ---- common actions ---- */
  'action.add': ['Add', 'شامل کریں'],
  'action.save': ['Save', 'محفوظ کریں'],
  'action.cancel': ['Cancel', 'منسوخ کریں'],
  'action.edit': ['Edit', 'تبدیلی کریں'],
  'action.search': ['Search anything…', 'کچھ بھی تلاش کریں…'],
  'action.recordPurchase': ['Record purchase', 'خریداری درج کریں'],
  'action.recordSale': ['Record sale', 'فروخت درج کریں'],
  'action.openMenu': ['Open the menu', 'مینو کھولیں'],
  'action.closeMenu': ['Close the menu', 'مینو بند کریں'],
  'action.menu': ['Menu', 'مینو'],
  'action.openStock': ['Open stock', 'اسٹاک کھولیں'],

  /* ---- shell ---- */
  'shell.demoTitle': ['Demo version', 'ڈیمو ورژن'],
  'shell.asOf': ['Figures shown as of', 'اعداد و شمار بتاریخ'],
  'shell.resetNote': [
    'Anything you add is cleared when the page is refreshed.',
    'صفحہ ریفریش کرنے پر آپ کا شامل کردہ ڈیٹا ختم ہو جائے گا۔',
  ],

  /* ---- dashboard ---- */
  'dash.subtitle': ['A summary of the business as of', 'کاروبار کا خلاصہ بتاریخ'],
  'dash.totalProducts': ['Total products', 'کل پروڈکٹس'],
  'dash.totalProducts.sub': ['Items we sell', 'وہ اشیاء جو ہم بیچتے ہیں'],
  'dash.across': ['Across', 'کل'],
  'dash.groups': ['groups', 'گروپس میں'],
  'dash.stockValue': ['Stock we can sell', 'قابلِ فروخت اسٹاک'],
  'dash.stockValue.sub': ['On the shelves, at what we paid', 'شیلف پر موجود، خرید قیمت پر'],
  'dash.expiredNotCounted': ['expired, not counted', 'میعاد ختم، شمار نہیں'],
  'dash.cashInHand': ['Cash in hand', 'نقد موجود'],
  'dash.cashInHand.sub': ['Money received minus money paid', 'وصول شدہ رقم منہا ادا شدہ رقم'],
  'dash.owedToUs': ['Customers owe us', 'گاہکوں کے ذمے'],
  'dash.owedToUs.sub': ['Sales on credit, not yet paid', 'ادھار فروخت، ابھی ادائیگی نہیں ہوئی'],
  'dash.allPaid': ['Everyone has paid', 'سب نے ادائیگی کر دی'],
  'dash.weOwe': ['We owe suppliers', 'ہمارے ذمے سپلائر کا'],
  'dash.weOwe.sub': ['Stock taken on credit', 'ادھار پر لیا گیا اسٹاک'],
  'dash.nothingOutstanding': ['Nothing outstanding', 'کچھ باقی نہیں'],
  'dash.expiringSoon': ['Expiring soon', 'جلد میعاد ختم'],
  'dash.expiringSoon.sub': ['Batches with 30 days or less left', 'وہ بیچ جن کے 30 دن یا کم رہ گئے'],
  'dash.checkThese': ['Check these before they go to waste', 'ضائع ہونے سے پہلے انہیں دیکھ لیں'],
  'dash.nothingNeeds': ['Nothing needs attention', 'کسی چیز پر توجہ درکار نہیں'],
  'dash.salesWeek': ['Sales in the last 7 days', 'پچھلے 7 دن کی فروخت'],
  'dash.weekTotal': ['Total', 'کل'],
  'dash.weekEnding': ['over the week ending', 'اس ہفتے کے دوران، اختتام'],
  'dash.recent': ['Recent activity', 'حالیہ سرگرمی'],
  'dash.recent.sub': ['The latest things that happened, newest first.', 'تازہ ترین کارروائیاں، نئی پہلے۔'],
  'dash.nothingYet': ['Nothing has happened yet', 'ابھی کچھ نہیں ہوا'],
  'dash.nothingYet.sub': [
    'Record a purchase or a sale and it will show up here.',
    'خریداری یا فروخت درج کریں، یہاں نظر آ جائے گی۔',
  ],
  'dash.useFirst': ['Batches to use up first', 'پہلے استعمال کرنے والے بیچ'],
  'dash.useFirst.sub': [
    'These batches expire within 30 days. Sell or return them before they go to waste.',
    'ان بیچوں کی میعاد 30 دن میں ختم ہو رہی ہے۔ ضائع ہونے سے پہلے بیچ دیں یا واپس کر دیں۔',
  ],
  'dash.batch': ['Batch', 'بیچ'],
  'dash.expires': ['expires', 'میعاد ختم'],

  /* ---- settings ---- */
  'set.subtitle': ['How the system behaves for this business.', 'یہ سسٹم اس کاروبار کے لیے کس طرح کام کرے گا۔'],
  'set.business': ['Business', 'کاروبار'],
  'set.businessName': ['Business name', 'کاروبار کا نام'],
  'set.businessName.hint': ['Shown on printed documents.', 'چھپنے والے کاغذات پر یہی نام آئے گا۔'],

  'set.salesTax': ['Sales tax', 'سیلز ٹیکس'],
  'set.salesTax.sub': [
    'How tax is worked out. Nothing here is fixed in the software — pick what matches your returns.',
    'ٹیکس کس طرح لگایا جائے۔ یہ سافٹ ویئر میں طے شدہ نہیں — جو آپ کی ریٹرن کے مطابق ہو وہ منتخب کریں۔',
  ],
  'tax.exclusive-mrp': ['Added on top of MRP', 'ایم آر پی کے اوپر لگایا جائے'],
  'tax.exclusive-mrp.help': [
    'Tax is worked out on the MRP and added to the bill. The customer pays MRP plus tax.',
    'ٹیکس ایم آر پی پر لگتا ہے اور بل میں شامل کر دیا جاتا ہے۔ گاہک ایم آر پی کے ساتھ ٹیکس بھی دیتا ہے۔',
  ],
  'tax.inclusive-mrp': ['Already included in MRP', 'ایم آر پی میں پہلے سے شامل'],
  'tax.inclusive-mrp.help': [
    'The printed MRP is the final price. Tax is taken out of it and shown separately on the bill.',
    'چھپی ہوئی ایم آر پی ہی آخری قیمت ہے۔ ٹیکس اسی میں سے نکال کر بل پر الگ دکھایا جاتا ہے۔',
  ],
  'tax.on-rate': ['On the rate actually charged', 'اصل وصول کردہ ریٹ پر'],
  'tax.on-rate.help': [
    'Tax is worked out on the price you actually sold at, not on the MRP.',
    'ٹیکس اُس قیمت پر لگتا ہے جس پر آپ نے واقعی فروخت کی، ایم آر پی پر نہیں۔',
  ],
  'tax.none': ['No sales tax', 'کوئی سیلز ٹیکس نہیں'],
  'tax.none.help': ['Sales tax is switched off everywhere.', 'سیلز ٹیکس ہر جگہ بند ہے۔'],

  'set.standardRate': ['Standard rate %', 'عام شرح فیصد'],
  'set.standardRate.hint': [
    'The rate a new product starts with. Any product can be set differently, or marked untaxed.',
    'نئی پروڈکٹ اسی شرح سے شروع ہوگی۔ کسی بھی پروڈکٹ کی شرح الگ رکھی جا سکتی ہے یا اسے بغیر ٹیکس کیا جا سکتا ہے۔',
  ],
  'set.furtherOn': ['Charge further tax to non-filers', 'نان فائلر سے فردر ٹیکس وصول کریں'],
  'set.furtherOn.help': [
    'An extra percentage on supplies to a buyer who is not on the tax roll.',
    'ایسے خریدار کو سپلائی پر اضافی فیصد جو ٹیکس رول پر نہیں ہے۔',
  ],
  'set.furtherOff': ['Do not charge further tax', 'فردر ٹیکس وصول نہ کریں'],
  'set.furtherOff.help': [
    'Everyone is billed the same regardless of tax status.',
    'ٹیکس اسٹیٹس سے قطع نظر سب کا بل ایک جیسا بنے گا۔',
  ],
  'set.furtherRate': ['Further tax %', 'فردر ٹیکس فیصد'],
  'set.furtherRate.hint': [
    'Applied to the goods value on invoices to non-filers only.',
    'صرف نان فائلر کے بل پر مالِ تجارت کی مالیت پر لاگو ہوگا۔',
  ],
  'set.example': ['What that does to a bill', 'اس کا بل پر کیا اثر پڑے گا'],
  'set.example.line': ['10 units, MRP', '10 عدد، ایم آر پی'],
  'set.example.soldAt': ['sold at', 'فروخت بمطابق'],
  'set.example.each': ['each, at', 'فی عدد، بشرح'],
  'set.goodsValue': ['Goods value', 'مال کی مالیت'],
  'set.taxAmount': ['Sales tax', 'سیلز ٹیکس'],
  'set.customerPays': ['Customer pays', 'گاہک ادا کرے گا'],
  'set.insideNote': [
    'The tax shown is already inside what the customer pays.',
    'دکھایا گیا ٹیکس گاہک کی ادائیگی میں پہلے سے شامل ہے۔',
  ],
  'set.taxFootnote': [
    'Changing any of this affects new invoices only. An invoice already recorded keeps the tax that was charged on the day, which is what an auditor expects.',
    'ان تبدیلیوں کا اثر صرف نئے بلوں پر ہوگا۔ پہلے سے درج بل پر وہی ٹیکس رہے گا جو اُس دن لگایا گیا تھا — آڈیٹر یہی توقع رکھتا ہے۔',
  ],

  'set.compliance': ['Compliance', 'ضوابط'],
  'set.compliance.sub': [
    'How strict the system is when a licence has run out.',
    'لائسنس ختم ہونے پر سسٹم کتنی سختی کرے۔',
  ],
  'set.block': ['Block the sale', 'فروخت روک دیں'],
  'set.block.help': [
    'A customer whose drug licence has expired cannot be sold to until it is renewed.',
    'جس گاہک کا ڈرگ لائسنس ختم ہو چکا ہے، تجدید تک اسے فروخت نہیں کی جا سکے گی۔',
  ],
  'set.warn': ['Warn only', 'صرف تنبیہ کریں'],
  'set.warn.help': [
    'Show a clear warning but let the user go ahead.',
    'واضح تنبیہ دکھائیں مگر صارف کو آگے بڑھنے دیں۔',
  ],

  'set.langSize': ['Language and text size', 'زبان اور متن کا سائز'],
  'set.langSize.sub': [
    'For everyone who has to read this screen all day.',
    'اُن سب کے لیے جنہیں دن بھر یہ اسکرین پڑھنی ہوتی ہے۔',
  ],
  'set.language': ['Language', 'زبان'],
  'set.language.note': [
    'Choosing Urdu also turns the whole layout right-to-left.',
    'اردو منتخب کرنے پر پورا صفحہ دائیں سے بائیں ہو جاتا ہے۔',
  ],
  'set.textSize': ['Text size', 'متن کا سائز'],
  'set.textSize.note': [
    'This changes every screen at once, not just this one.',
    'یہ صرف اس اسکرین کو نہیں بلکہ تمام اسکرینوں کو ایک ساتھ بدلتا ہے۔',
  ],
  'size.normal': ['Normal', 'عام'],
  'size.large': ['Large', 'بڑا'],
  'size.xlarge': ['Extra large', 'بہت بڑا'],

  'set.colours': ['What the colours mean', 'رنگوں کا مطلب'],
  'set.colours.sub': [
    'Every section has its own colour, and it runs through the whole page — not just a line at the top.',
    'ہر حصے کا اپنا رنگ ہے، اور وہ پورے صفحے پر چلتا ہے — صرف اوپر ایک لکیر نہیں۔',
  ],
  'set.codes': ['Code numbers', 'کوڈ نمبر'],
  'set.codes.sub': ['The numbering each kind of record uses.', 'ہر قسم کے ریکارڈ کی نمبرنگ۔'],
  'set.startsAt': ['Starts at', 'شروع'],
  'set.nextWillBe': ['next will be', 'اگلا ہوگا'],
  'set.savedRate': ['Standard rate saved', 'عام شرح محفوظ ہو گئی'],
  'set.savedFurther': ['Further tax rate saved', 'فردر ٹیکس کی شرح محفوظ ہو گئی'],
  'set.taxChanged': ['Tax setting changed', 'ٹیکس کی ترتیب بدل گئی'],
  'set.taxChanged.msg': [
    'New invoices will use this from now on. Invoices already recorded are not touched.',
    'اب سے نئے بل اسی کے مطابق بنیں گے۔ پہلے سے درج بلوں پر کوئی اثر نہیں پڑے گا۔',
  ],
}

const LANGUAGES = [
  { id: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { id: 'ur', label: 'Urdu', native: 'اردو', dir: 'rtl' },
]

export const FONT_SCALES = [
  { id: 'normal', labelKey: 'size.normal', label: 'Normal', px: 16 },
  { id: 'large', labelKey: 'size.large', label: 'Large', px: 18 },
  { id: 'xlarge', labelKey: 'size.xlarge', label: 'Extra large', px: 20 },
]

export { LANGUAGES }

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const { settings } = useData()
  const language = settings.language === 'ur' ? 'ur' : 'en'
  const index = language === 'ur' ? 1 : 0
  const dir = language === 'ur' ? 'rtl' : 'ltr'

  const scale = FONT_SCALES.find((s) => s.id === settings.fontScale) || FONT_SCALES[0]

  useEffect(() => {
    const root = document.documentElement
    root.lang = language
    root.dir = dir
    // Everything is sized in rem, so moving the root size moves the whole
    // interface together rather than one screen at a time.
    root.style.fontSize = `${scale.px}px`
    return () => {
      root.style.fontSize = ''
    }
  }, [language, dir, scale.px])

  const value = useMemo(() => {
    const t = (key, fallback) => {
      const entry = DICTIONARY[key]
      if (!entry) return fallback !== undefined ? fallback : key
      return entry[index] || entry[0]
    }
    /** True when this key has no translation yet, so the caller can mark it. */
    const untranslated = (key) => language !== 'en' && !DICTIONARY[key]
    return { t, untranslated, language, dir, isRtl: dir === 'rtl', fontScale: scale.id }
  }, [index, language, dir, scale.id])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useT must be used inside an I18nProvider')
  return context
}
