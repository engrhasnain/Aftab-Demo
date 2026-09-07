/**
 * Raso Pakistan — demo seed data.
 *
 * This is the ONLY data source in the app. It is loaded into React state on
 * first render and mutated in memory from there. Nothing is persisted: a
 * browser refresh resets everything back to exactly what is in this file.
 *
 * The whole dataset is "as of" REFERENCE_DATE. Every date-relative calculation
 * in the app (expiring soon, sales in the last 7 days, current month salaries)
 * is measured against that fixed date rather than the real clock, so the demo
 * looks identical no matter which day it is shown on.
 */

import { calcLine, calcTotals } from '../utils/tax'

export const REFERENCE_DATE = '2025-06-15'

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/**
 * Nothing about tax is fixed in the code. The business picks how tax is worked
 * out and the default rate, and every product can override the rate or be
 * marked not taxable. Changing these affects NEW documents only — a recorded
 * invoice keeps the tax that was charged on the day.
 */
export const defaultSettings = {
  businessName: 'Raso International Pakistan',
  taxMode: 'exclusive-mrp',
  defaultTaxPercent: 18,
  language: 'en',
  fontScale: 'large',
  blockExpiredLicence: true,
  // Supplies to a buyer who is not on the tax roll attract an extra
  // percentage. Both the switch and the rate belong to the business.
  furtherTaxEnabled: true,
  furtherTaxPercent: 3,
  // Tax paid to suppliers on stock coming in. Claimed back against the tax
  // charged on sales, which is what makes a real return possible.
  inputTaxEnabled: true,
  codeSeries: {
    product: 1, supplier: 4000, customer: 6000, employee: 9000,
    expense: 8000, offer: 7000, investor: 5000, saleReturn: 2500, purchaseReturn: 1500,
  },
}

/* ------------------------------------------------------------------ */
/* Suppliers                                                           */
/* ------------------------------------------------------------------ */

export const suppliers = [
  {
    id: 'sup-01',
    code: 4000,
    colour: '#2A3785',
    name: 'Karachi Nutrition Imports (Pvt) Ltd',
    longAddress: 'Plot 42-B, Sector 15, Korangi Industrial Area, Karachi, Sindh 74900',
    shortAddress: 'Korangi, Karachi',
    contactNumber: '021-3506-8842',
  },
  {
    id: 'sup-02',
    code: 4001,
    colour: '#B45309',
    name: 'Al-Madina Foods & Beverages',
    longAddress: '18-C, Jail Road, Gulberg III, Lahore, Punjab 54660',
    shortAddress: 'Gulberg, Lahore',
    contactNumber: '042-3577-1290',
  },
  {
    id: 'sup-03',
    code: 4002,
    colour: '#A16207',
    name: 'Emirates Date Company (Pak) Ltd',
    longAddress: 'Warehouse 7, Port Qasim Authority Area, Bin Qasim Town, Karachi, Sindh 75020',
    shortAddress: 'Port Qasim, Karachi',
    contactNumber: '021-3472-6611',
  },
  {
    id: 'sup-04',
    code: 4003,
    colour: '#15803D',
    name: 'Punjab Organics (Pvt) Ltd',
    longAddress: 'Chak No. 214 RB, Sheikhupura Road, Faisalabad, Punjab 38000',
    shortAddress: 'Sheikhupura Rd, Faisalabad',
    contactNumber: '041-2634-778',
  },
  {
    id: 'sup-05',
    code: 4004,
    colour: '#7C3AED',
    name: 'Lahore Baby Care Distributors',
    longAddress: '55 Shadman Market, Shadman Colony, Lahore, Punjab 54000',
    shortAddress: 'Shadman, Lahore',
    contactNumber: '042-3758-4402',
  },
  {
    id: 'sup-06',
    code: 4005,
    colour: '#BE123C',
    name: 'Indus Health Products',
    longAddress: 'Suite 304, Progressive Centre, Shahrah-e-Faisal, Karachi, Sindh 75350',
    shortAddress: 'Shahrah-e-Faisal, Karachi',
    contactNumber: '021-3431-9955',
  },
  {
    id: 'sup-07',
    code: 4006,
    colour: '#0F766E',
    name: 'Gulf Nutrition Trading',
    longAddress: 'Office 12, Blue Area, Jinnah Avenue, Islamabad 44000',
    shortAddress: 'Blue Area, Islamabad',
    contactNumber: '051-2872-336',
  },
  {
    id: 'sup-08',
    code: 4007,
    colour: '#0E7490',
    name: 'Faisalabad Agro Naturals',
    longAddress: 'Plot 9, Small Industrial Estate, Sargodha Road, Faisalabad, Punjab 38090',
    shortAddress: 'Sargodha Rd, Faisalabad',
    contactNumber: '041-8556-104',
  },
]

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export const customers = [
  {
    id: 'cus-01',
    code: 6000,
    businessTitle: 'Al-Barkat Traders (Regd.)',
    licenceNumber: 'DSL-KHI-2019-4412',
    licenceExpiry: '2026-03-31',
    taxStatus: 'filer',
    ntn: '3520112-4',
    name: 'Al-Barkat Traders',
    longAddress: 'Shop 21, Jodia Bazaar, Kharadar, Karachi, Sindh 74000',
    shortAddress: 'Jodia Bazaar, Karachi',
    contactNumber: '0300-2214-778',
  },
  {
    id: 'cus-02',
    code: 6001,
    businessTitle: 'Madina Cash & Carry',
    licenceNumber: 'DSL-LHR-2021-8830',
    licenceExpiry: '2025-07-10',
    taxStatus: 'non-filer',
    ntn: '',
    name: 'Madina Cash & Carry',
    longAddress: '4-A Main Boulevard, Faisal Town, Lahore, Punjab 54770',
    shortAddress: 'Faisal Town, Lahore',
    contactNumber: '0321-4488-190',
  },
  {
    id: 'cus-03',
    code: 6002,
    businessTitle: 'Ideal Pharmacy & Chemists',
    licenceNumber: 'DSL-KHI-2020-1177',
    licenceExpiry: '2027-01-15',
    taxStatus: 'filer',
    ntn: '4410098-2',
    name: 'Ideal Pharmacy',
    longAddress: 'Shop 3, Doctors Plaza, Tariq Road, Karachi, Sindh 75400',
    shortAddress: 'Tariq Road, Karachi',
    contactNumber: '0333-2907-455',
  },
  {
    id: 'cus-04',
    code: 6003,
    businessTitle: 'Shaheen General Store',
    licenceNumber: '',
    licenceExpiry: null,
    taxStatus: 'non-filer',
    ntn: '',
    name: 'Shaheen General Store',
    longAddress: 'House 112, Street 9, G-9 Markaz, Islamabad 44000',
    shortAddress: 'G-9 Markaz, Islamabad',
    contactNumber: '0345-5120-663',
  },
  {
    id: 'cus-05',
    code: 6004,
    businessTitle: 'Green Valley Superstore (Pvt)',
    licenceNumber: 'DSL-FSD-2022-6501',
    licenceExpiry: '2026-11-30',
    taxStatus: 'filer',
    ntn: '3310457-9',
    name: 'Green Valley Superstore',
    longAddress: '77 Susan Road, Madina Town, Faisalabad, Punjab 38000',
    shortAddress: 'Madina Town, Faisalabad',
    contactNumber: '0301-7745-208',
  },
  {
    id: 'cus-06',
    code: 6005,
    businessTitle: 'Noor Medical Store',
    licenceNumber: 'DSL-LHR-2018-2244',
    licenceExpiry: '2025-05-20',
    taxStatus: 'filer',
    ntn: '3520778-1',
    name: 'Noor Medical Store',
    longAddress: 'Shop 8, Anarkali Bazaar, Lahore, Punjab 54000',
    shortAddress: 'Anarkali, Lahore',
    contactNumber: '0322-8834-017',
  },
  {
    id: 'cus-07',
    code: 6006,
    businessTitle: 'City Mart Gulberg',
    licenceNumber: '',
    licenceExpiry: null,
    taxStatus: 'non-filer',
    ntn: '',
    name: 'City Mart Gulberg',
    longAddress: '31-D1, Gulberg III, Main Market, Lahore, Punjab 54660',
    shortAddress: 'Main Market, Lahore',
    contactNumber: '0304-6612-889',
  },
  {
    id: 'cus-08',
    code: 6007,
    businessTitle: 'Baby World Karachi',
    licenceNumber: 'DSL-KHI-2023-9012',
    licenceExpiry: '2026-08-14',
    taxStatus: 'filer',
    ntn: '4410332-7',
    name: 'Baby World Karachi',
    longAddress: 'Shop 14, Dolmen Mall Ground Floor, Clifton Block 4, Karachi, Sindh 75600',
    shortAddress: 'Clifton, Karachi',
    contactNumber: '0311-2266-540',
  },
  {
    id: 'cus-09',
    code: 6008,
    businessTitle: 'Sabir Kiryana Store',
    licenceNumber: '',
    licenceExpiry: null,
    taxStatus: 'non-filer',
    ntn: '',
    name: 'Sabir Kiryana Store',
    longAddress: 'Adda Plot, Ferozepur Road, Kasur, Punjab 55050',
    shortAddress: 'Ferozepur Rd, Kasur',
    contactNumber: '0308-9971-334',
  },
  {
    id: 'cus-10',
    code: 6009,
    businessTitle: 'Metro Family Bazaar',
    licenceNumber: 'DSL-PEW-2021-3390',
    licenceExpiry: '2025-06-28',
    taxStatus: 'filer',
    ntn: '1730220-5',
    name: 'Metro Family Bazaar',
    longAddress: '2nd Floor, Saddar Plaza, Peshawar Cantt, Peshawar, KPK 25000',
    shortAddress: 'Saddar, Peshawar',
    contactNumber: '0347-3308-121',
  },
]

/* ------------------------------------------------------------------ */
/* Product groups & products                                           */
/* ------------------------------------------------------------------ */

export const productGroups = [
  { id: 'grp-01', name: 'Baby Cereal', supplierId: 'sup-01' },
  { id: 'grp-02', name: 'Infant Formula', supplierId: 'sup-01' },
  { id: 'grp-03', name: 'Date Syrup', supplierId: 'sup-03' },
  { id: 'grp-04', name: 'Apple Cider Vinegar', supplierId: 'sup-04' },
  { id: 'grp-05', name: 'Organic Baby Cereal', supplierId: 'sup-05' },
  { id: 'grp-06', name: 'Follow-on Formula', supplierId: 'sup-06' },
  { id: 'grp-07', name: 'Date Products', supplierId: 'sup-07' },
  { id: 'grp-08', name: 'Natural Vinegars', supplierId: 'sup-08' },
  { id: 'grp-09', name: 'Baby Snacks', supplierId: 'sup-02' },
  { id: 'grp-10', name: 'Controlled Medicines', supplierId: 'sup-06' },
]

// mrp = printed retail price, tp = trade price to shops, purchaseCost = what we pay.
// taxable / salesTaxPercent are per product: in one catalogue some items are taxed and
// some are not, and that can change. Offers and free-goods schemes are separate
// records, so a campaign can start and finish without editing the product.
// controlled = a restricted medicine that must appear in the narcotics register.
export const products = [
  { id: 'prd-01', code: 1, name: 'Raso Baby Cereal — Wheat & Milk 350g', groupId: 'grp-01', supplierId: 'sup-01', mrp: 950, tp: 855, purchaseCost: 640, taxable: true, salesTaxPercent: 18, colour: '#2A3785', controlled: false, unit: 'pack', unitsPerCarton: 24 },
  { id: 'prd-02', code: 2, name: 'Raso Baby Cereal — Rice & Milk 350g', groupId: 'grp-01', supplierId: 'sup-01', mrp: 950, tp: 855, purchaseCost: 640, taxable: true, salesTaxPercent: 18, colour: '#2A3785', controlled: false, unit: 'pack', unitsPerCarton: 24 },
  { id: 'prd-03', code: 3, name: 'Raso Baby Cereal — Mixed Fruit 175g', groupId: 'grp-01', supplierId: 'sup-01', mrp: 520, tp: 468, purchaseCost: 348.5, taxable: true, salesTaxPercent: 18, colour: '#3B4CA4', controlled: false, unit: 'pack', unitsPerCarton: 36 },
  { id: 'prd-04', code: 4, name: 'NutriStart Infant Formula Stage 1 — 400g', groupId: 'grp-02', supplierId: 'sup-01', mrp: 2450, tp: 2205, purchaseCost: 1650, taxable: true, salesTaxPercent: 18, colour: '#0F766E', controlled: false, unit: 'tin', unitsPerCarton: 12 },
  { id: 'prd-05', code: 5, name: 'NutriStart Infant Formula Stage 2 — 400g', groupId: 'grp-02', supplierId: 'sup-01', mrp: 2380, tp: 2142, purchaseCost: 1600, taxable: true, salesTaxPercent: 18, colour: '#0F766E', controlled: false, unit: 'tin', unitsPerCarton: 12 },
  { id: 'prd-06', code: 6, name: 'NutriStart Infant Formula Stage 1 — 900g', groupId: 'grp-02', supplierId: 'sup-01', mrp: 4980, tp: 4482, purchaseCost: 3350, taxable: true, salesTaxPercent: 18, colour: '#0E7490', controlled: false, unit: 'tin', unitsPerCarton: 6 },
  { id: 'prd-07', code: 7, name: 'Raso Date Syrup 500ml', groupId: 'grp-03', supplierId: 'sup-03', mrp: 780, tp: 702, purchaseCost: 520, taxable: false, salesTaxPercent: 0, colour: '#A16207', controlled: false, unit: 'bottle', unitsPerCarton: 12 },
  { id: 'prd-08', code: 8, name: 'Raso Date Syrup 1 Litre', groupId: 'grp-03', supplierId: 'sup-03', mrp: 1420, tp: 1278, purchaseCost: 950, taxable: false, salesTaxPercent: 0, colour: '#A16207', controlled: false, unit: 'bottle', unitsPerCarton: 6 },
  { id: 'prd-09', code: 9, name: 'Raso Apple Cider Vinegar with Mother 500ml', groupId: 'grp-04', supplierId: 'sup-04', mrp: 689.5, tp: 620.55, purchaseCost: 460, taxable: true, salesTaxPercent: 18, colour: '#15803D', controlled: false, unit: 'bottle', unitsPerCarton: 12 },
  { id: 'prd-10', code: 10, name: 'Raso Apple Cider Vinegar with Mother 1 Litre', groupId: 'grp-04', supplierId: 'sup-04', mrp: 1250, tp: 1125, purchaseCost: 835, taxable: true, salesTaxPercent: 18, colour: '#15803D', controlled: false, unit: 'bottle', unitsPerCarton: 6 },
  { id: 'prd-11', code: 11, name: 'LittleOne Organic Oats Baby Cereal 300g', groupId: 'grp-05', supplierId: 'sup-05', mrp: 1180, tp: 1062, purchaseCost: 790, taxable: true, salesTaxPercent: 18, colour: '#7C3AED', controlled: false, unit: 'pack', unitsPerCarton: 24 },
  { id: 'prd-12', code: 12, name: 'GrowWell Follow-on Formula Stage 3 — 400g', groupId: 'grp-06', supplierId: 'sup-06', mrp: 2150, tp: 1935, purchaseCost: 1440, taxable: true, salesTaxPercent: 18, colour: '#BE123C', controlled: false, unit: 'tin', unitsPerCarton: 12 },
  { id: 'prd-13', code: 13, name: 'Ajwa Date Paste 800g', groupId: 'grp-07', supplierId: 'sup-07', mrp: 1650, tp: 1485, purchaseCost: 1105, taxable: false, salesTaxPercent: 0, colour: '#B45309', controlled: false, unit: 'jar', unitsPerCarton: 12 },
  { id: 'prd-14', code: 14, name: 'Raso Sugarcane Vinegar 500ml', groupId: 'grp-08', supplierId: 'sup-08', mrp: 419.5, tp: 377.55, purchaseCost: 280, taxable: true, salesTaxPercent: 18, colour: '#0E7490', controlled: false, unit: 'bottle', unitsPerCarton: 12 },
  { id: 'prd-15', code: 15, name: 'Raso Baby Puffs — Banana 60g', groupId: 'grp-09', supplierId: 'sup-02', mrp: 480, tp: 432, purchaseCost: 320, taxable: true, salesTaxPercent: 18, colour: '#B45309', controlled: false, unit: 'pack', unitsPerCarton: 48 },
  { id: 'prd-16', code: 16, name: 'Codeine Linctus BP 120ml', groupId: 'grp-10', supplierId: 'sup-06', mrp: 620, tp: 558, purchaseCost: 320, taxable: true, salesTaxPercent: 18, colour: '#9E2C20', controlled: true, unit: 'bottle', unitsPerCarton: 24 },
]

/* ------------------------------------------------------------------ */
/* Employees                                                           */
/* ------------------------------------------------------------------ */

export const employees = [
  { id: 'emp-01', code: 9000, name: 'Ahmed Khan', designation: 'Sales Officer', monthlySalary: 65000 },
  { id: 'emp-02', code: 9001, name: 'Bilal Hussain', designation: 'Delivery Driver', monthlySalary: 45000 },
  { id: 'emp-03', code: 9002, name: 'Fatima Noor', designation: 'Accounts Assistant', monthlySalary: 55000 },
  { id: 'emp-04', code: 9003, name: 'Usman Tariq', designation: 'Warehouse Supervisor', monthlySalary: 60000 },
  { id: 'emp-05', code: 9004, name: 'Sana Iqbal', designation: 'Order Booker', monthlySalary: 48000 },
  { id: 'emp-06', code: 9005, name: 'Imran Shah', designation: 'Sales Manager', monthlySalary: 110000 },
  { id: 'emp-07', code: 9006, name: 'Rizwan Ali', designation: 'Loader', monthlySalary: 32000 },
  { id: 'emp-08', code: 9007, name: 'Ayesha Malik', designation: 'Office Assistant', monthlySalary: 38000 },
]

/* ------------------------------------------------------------------ */
/* Purchases (authored) — stock batches are derived from these         */
/* ------------------------------------------------------------------ */

const purchaseSeeds = [
  {
    id: 'pur-1001', supplierId: 'sup-01', purchaseDate: '2025-04-22', paymentStatus: 'paid',
    items: [
      { productId: 'prd-01', batchNumber: 'BCW-2404', expiryDate: '2026-04-30', qty: 120, unitCost: 640 },
      { productId: 'prd-02', batchNumber: 'BCR-2404', expiryDate: '2026-04-30', qty: 100, unitCost: 640 },
      { productId: 'prd-03', batchNumber: 'BCF-2404', expiryDate: '2025-06-19', qty: 60, unitCost: 348 },
    ],
  },
  {
    id: 'pur-1002', supplierId: 'sup-01', purchaseDate: '2025-04-28', paymentStatus: 'paid',
    items: [
      { productId: 'prd-04', batchNumber: 'NS1-2404', expiryDate: '2026-10-15', qty: 80, unitCost: 1650 },
      { productId: 'prd-05', batchNumber: 'NS2-2404', expiryDate: '2026-09-30', qty: 60, unitCost: 1600 },
    ],
  },
  {
    id: 'pur-1003', supplierId: 'sup-03', purchaseDate: '2025-05-02', paymentStatus: 'paid',
    items: [
      { productId: 'prd-07', batchNumber: 'DS5-2405', expiryDate: '2026-05-10', qty: 150, unitCost: 520 },
      { productId: 'prd-08', batchNumber: 'DS1-2405', expiryDate: '2026-05-10', qty: 90, unitCost: 950 },
      { productId: 'prd-07', batchNumber: 'DS5-2404', expiryDate: '2025-06-28', qty: 50, unitCost: 500 },
    ],
  },
  {
    id: 'pur-1004', supplierId: 'sup-04', purchaseDate: '2025-05-06', paymentStatus: 'paid',
    items: [
      { productId: 'prd-09', batchNumber: 'ACV5-2505', expiryDate: '2027-05-01', qty: 200, unitCost: 460 },
      { productId: 'prd-10', batchNumber: 'ACV1-2505', expiryDate: '2027-05-01', qty: 120, unitCost: 835 },
    ],
  },
  {
    id: 'pur-1005', supplierId: 'sup-05', purchaseDate: '2025-05-11', paymentStatus: 'paid',
    items: [
      { productId: 'prd-11', batchNumber: 'LO-2505', expiryDate: '2025-07-05', qty: 90, unitCost: 790 },
    ],
  },
  {
    id: 'pur-1006', supplierId: 'sup-06', purchaseDate: '2025-05-15', paymentStatus: 'paid',
    items: [
      { productId: 'prd-12', batchNumber: 'GW3-2505', expiryDate: '2026-08-12', qty: 70, unitCost: 1440 },
      { productId: 'prd-12', batchNumber: 'GW3-2412', expiryDate: '2025-07-08', qty: 35, unitCost: 1420 },
      { productId: 'prd-16', batchNumber: 'CDL-2505', expiryDate: '2026-09-30', qty: 40, unitCost: 320 },
    ],
  },
  {
    id: 'pur-1007', supplierId: 'sup-01', purchaseDate: '2025-05-20', paymentStatus: 'paid',
    items: [
      { productId: 'prd-06', batchNumber: 'NS1L-2505', expiryDate: '2026-11-05', qty: 45, unitCost: 3350 },
      { productId: 'prd-01', batchNumber: 'BCW-2505', expiryDate: '2026-05-25', qty: 150, unitCost: 640 },
    ],
  },
  {
    id: 'pur-1008', supplierId: 'sup-07', purchaseDate: '2025-05-24', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-13', batchNumber: 'AJP-2505', expiryDate: '2026-02-28', qty: 80, unitCost: 1105 },
    ],
  },
  {
    id: 'pur-1009', supplierId: 'sup-08', purchaseDate: '2025-05-29', paymentStatus: 'paid',
    items: [
      { productId: 'prd-14', batchNumber: 'SCV-2505', expiryDate: '2026-12-15', qty: 160, unitCost: 280 },
    ],
  },
  {
    id: 'pur-1010', supplierId: 'sup-02', purchaseDate: '2025-06-03', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-15', batchNumber: 'BPB-2506', expiryDate: '2026-06-01', qty: 140, unitCost: 320 },
    ],
  },
  {
    id: 'pur-1011', supplierId: 'sup-01', purchaseDate: '2025-06-09', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-04', batchNumber: 'NS1-2506', expiryDate: '2027-01-20', qty: 100, unitCost: 1650 },
      { productId: 'prd-05', batchNumber: 'NS2-2506', expiryDate: '2026-12-30', qty: 80, unitCost: 1600 },
      { productId: 'prd-02', batchNumber: 'BCR-2506', expiryDate: '2026-06-10', qty: 120, unitCost: 640 },
    ],
  },
  {
    id: 'pur-1012', supplierId: 'sup-03', purchaseDate: '2025-06-14', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-07', batchNumber: 'DS5-2506', expiryDate: '2027-06-01', qty: 180, unitCost: 520 },
      { productId: 'prd-08', batchNumber: 'DS1-2506', expiryDate: '2027-06-01', qty: 110, unitCost: 950 },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Sales (authored against batch numbers, resolved to batch ids below) */
/* ------------------------------------------------------------------ */

const saleSeeds = [
  {
    id: 'sal-2001', customerId: 'cus-01', saleDate: '2025-05-05', paymentStatus: 'paid',
    items: [
      { productId: 'prd-01', batchNumber: 'BCW-2404', qty: 30, unitPrice: 855 },
      { productId: 'prd-02', batchNumber: 'BCR-2404', qty: 25, unitPrice: 855 },
    ],
  },
  {
    id: 'sal-2002', customerId: 'cus-02', saleDate: '2025-05-09', paymentStatus: 'paid',
    items: [
      { productId: 'prd-04', batchNumber: 'NS1-2404', qty: 20, unitPrice: 2205 },
      { productId: 'prd-05', batchNumber: 'NS2-2404', qty: 15, unitPrice: 2142 },
    ],
  },
  {
    id: 'sal-2003', customerId: 'cus-03', saleDate: '2025-05-13', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-04', batchNumber: 'NS1-2404', qty: 12, unitPrice: 2205 },
      { productId: 'prd-03', batchNumber: 'BCF-2404', qty: 20, unitPrice: 468 },
    ],
  },
  {
    id: 'sal-2004', customerId: 'cus-04', saleDate: '2025-05-17', paymentStatus: 'paid',
    items: [
      { productId: 'prd-07', batchNumber: 'DS5-2405', qty: 60, unitPrice: 702 },
      { productId: 'prd-09', batchNumber: 'ACV5-2505', qty: 50, unitPrice: 621 },
      { productId: 'prd-07', batchNumber: 'DS5-2404', qty: 15, unitPrice: 702 },
    ],
  },
  {
    id: 'sal-2005', customerId: 'cus-05', saleDate: '2025-05-21', paymentStatus: 'paid',
    items: [
      { productId: 'prd-08', batchNumber: 'DS1-2405', qty: 40, unitPrice: 1278 },
      { productId: 'prd-10', batchNumber: 'ACV1-2505', qty: 45, unitPrice: 1125 },
      { productId: 'prd-01', batchNumber: 'BCW-2404', qty: 40, unitPrice: 855 },
    ],
  },
  {
    id: 'sal-2006', customerId: 'cus-06', saleDate: '2025-05-24', paymentStatus: 'paid',
    items: [
      { productId: 'prd-05', batchNumber: 'NS2-2404', qty: 18, unitPrice: 2142 },
      { productId: 'prd-12', batchNumber: 'GW3-2505', qty: 15, unitPrice: 1935 },
    ],
  },
  {
    id: 'sal-2007', customerId: 'cus-07', saleDate: '2025-05-28', paymentStatus: 'paid',
    items: [
      { productId: 'prd-11', batchNumber: 'LO-2505', qty: 30, unitPrice: 1062 },
      { productId: 'prd-13', batchNumber: 'AJP-2505', qty: 25, unitPrice: 1485 },
    ],
  },
  {
    id: 'sal-2008', customerId: 'cus-08', saleDate: '2025-06-02', paymentStatus: 'paid',
    items: [
      { productId: 'prd-06', batchNumber: 'NS1L-2505', qty: 18, unitPrice: 4482 },
      { productId: 'prd-04', batchNumber: 'NS1-2404', qty: 25, unitPrice: 2205 },
    ],
  },
  {
    id: 'sal-2009', customerId: 'cus-09', saleDate: '2025-06-09', paymentStatus: 'unpaid',
    items: [
      { productId: 'prd-14', batchNumber: 'SCV-2505', qty: 70, unitPrice: 378 },
      { productId: 'prd-09', batchNumber: 'ACV5-2505', qty: 60, unitPrice: 621 },
    ],
  },
  {
    id: 'sal-2010', customerId: 'cus-10', saleDate: '2025-06-10', paymentStatus: 'paid',
    items: [
      { productId: 'prd-01', batchNumber: 'BCW-2505', qty: 70, unitPrice: 855 },
      { productId: 'prd-02', batchNumber: 'BCR-2404', qty: 45, unitPrice: 855 },
      { productId: 'prd-15', batchNumber: 'BPB-2506', qty: 60, unitPrice: 432 },
    ],
  },
  {
    id: 'sal-2011', customerId: 'cus-01', saleDate: '2025-06-11', paymentStatus: 'paid',
    items: [
      { productId: 'prd-07', batchNumber: 'DS5-2405', qty: 55, unitPrice: 702 },
      { productId: 'prd-08', batchNumber: 'DS1-2405', qty: 30, unitPrice: 1278 },
      { productId: 'prd-14', batchNumber: 'SCV-2505', qty: 60, unitPrice: 378 },
    ],
  },
  {
    id: 'sal-2012', customerId: 'cus-05', saleDate: '2025-06-12', paymentStatus: 'paid',
    items: [
      { productId: 'prd-04', batchNumber: 'NS1-2506', qty: 55, unitPrice: 2205 },
      { productId: 'prd-05', batchNumber: 'NS2-2506', qty: 50, unitPrice: 2142 },
    ],
  },
  {
    id: 'sal-2013', customerId: 'cus-02', saleDate: '2025-06-13', paymentStatus: 'paid',
    items: [
      { productId: 'prd-01', batchNumber: 'BCW-2505', qty: 50, unitPrice: 855 },
      { productId: 'prd-11', batchNumber: 'LO-2505', qty: 35, unitPrice: 1062 },
      { productId: 'prd-10', batchNumber: 'ACV1-2505', qty: 30, unitPrice: 1125 },
      { productId: 'prd-09', batchNumber: 'ACV5-2505', qty: 55, unitPrice: 621 },
    ],
  },
  {
    id: 'sal-2014', customerId: 'cus-03', saleDate: '2025-06-14', paymentStatus: 'paid',
    items: [
      { productId: 'prd-06', batchNumber: 'NS1L-2505', qty: 12, unitPrice: 4482 },
      { productId: 'prd-12', batchNumber: 'GW3-2412', qty: 20, unitPrice: 1935 },
      { productId: 'prd-07', batchNumber: 'DS5-2506', qty: 90, unitPrice: 702 },
      { productId: 'prd-08', batchNumber: 'DS1-2506', qty: 55, unitPrice: 1278 },
      { productId: 'prd-16', batchNumber: 'CDL-2505', qty: 15, unitPrice: 558 },
    ],
  },
  {
    id: 'sal-2015', customerId: 'cus-08', saleDate: '2025-06-15', paymentStatus: 'paid',
    items: [
      { productId: 'prd-02', batchNumber: 'BCR-2506', qty: 90, unitPrice: 855 },
      { productId: 'prd-15', batchNumber: 'BPB-2506', qty: 45, unitPrice: 432 },
      { productId: 'prd-13', batchNumber: 'AJP-2505', qty: 20, unitPrice: 1485 },
    ],
  },
]

/* What was in the cash box before the system was switched on. Without this,
   "cash in hand" would only be movement since the records began. */
export const openingBalance = {
  date: '2025-04-01',
  amount: 500000,
  note: 'Opening cash brought forward',
}

/* Running costs that are not stock and not salaries. */
export const expenses = [
  { id: 'exp-001', code: 8000, date: '2025-04-05', category: 'Rent', payee: 'Warehouse landlord', amount: 85000, note: 'April rent' },
  { id: 'exp-002', code: 8001, date: '2025-05-05', category: 'Rent', payee: 'Warehouse landlord', amount: 85000, note: 'May rent' },
  { id: 'exp-003', code: 8002, date: '2025-06-03', category: 'Electricity', payee: 'K-Electric', amount: 31200, note: 'Warehouse and office' },
  { id: 'exp-004', code: 8003, date: '2025-06-05', category: 'Fuel', payee: 'Shell Korangi', amount: 22500, note: 'Delivery van' },
  { id: 'exp-005', code: 8004, date: '2025-06-11', category: 'Repairs', payee: 'Cool Tech Services', amount: 14800, note: 'Cold room servicing' },
]

export const EXPENSE_CATEGORIES = [
  'Rent', 'Electricity', 'Fuel', 'Repairs', 'Telephone & internet',
  'Packaging', 'Freight', 'Commission', 'Government fees', 'Other',
]

/**
 * Offers and schemes.
 *
 * These used to live as a single field on each product, which meant an offer
 * could never start, finish, or be switched off without editing the product
 * itself. They are their own records now, with dates, so a campaign can be set
 * up in advance and stopped without touching the catalogue.
 */
export const offers = [
  { id: 'ofr-001', code: 7000, name: 'Wheat & Milk — buy 10 get 1', productId: 'prd-01', type: 'bonus', buyQty: 10, freeQty: 1, percent: 0, amount: 0, startDate: '2025-04-01', endDate: null, active: true, note: 'Standing trade scheme' },
  { id: 'ofr-002', code: 7001, name: 'Stage 1 formula — buy 12 get 1', productId: 'prd-04', type: 'bonus', buyQty: 12, freeQty: 1, percent: 0, amount: 0, startDate: '2025-04-01', endDate: null, active: true, note: 'Principal company scheme' },
  { id: 'ofr-003', code: 7002, name: 'Baby Puffs — buy 20 get 2', productId: 'prd-15', type: 'bonus', buyQty: 20, freeQty: 2, percent: 0, amount: 0, startDate: '2025-06-01', endDate: '2025-08-31', active: true, note: 'Summer push' },
  { id: 'ofr-004', code: 7003, name: 'Date Syrup 1L — 5% off', productId: 'prd-08', type: 'discount-percent', buyQty: 0, freeQty: 0, percent: 5, amount: 0, startDate: '2025-06-10', endDate: '2025-06-30', active: true, note: 'Ramadan stock clearance' },
  { id: 'ofr-005', code: 7004, name: 'Mixed Fruit cereal — Rs 20 off', productId: 'prd-03', type: 'discount-amount', buyQty: 0, freeQty: 0, percent: 0, amount: 20, startDate: '2025-04-01', endDate: '2025-05-31', active: true, note: 'Finished — kept for the record' },
  { id: 'ofr-006', code: 7005, name: 'ACV 1 Litre — buy 6 get 1', productId: 'prd-10', type: 'bonus', buyQty: 6, freeQty: 1, percent: 0, amount: 0, startDate: '2025-07-01', endDate: '2025-09-30', active: true, note: 'Planned, not started yet' },
]

/**
 * Investors.
 *
 * The legacy system had an Investors screen: people who put capital into the
 * business and draw from it. Their money is real cash, so it belongs in the
 * ledger like everything else.
 */
export const investors = [
  { id: 'inv-001', code: 5000, name: 'Muhammad Raso', role: 'Owner', contactNumber: '0300-8200001', joinedOn: '2025-04-01', note: 'Founding capital' },
  { id: 'inv-002', code: 5001, name: 'Abdul Sattar', role: 'Silent partner', contactNumber: '0321-9110044', joinedOn: '2025-04-15', note: 'Working capital support' },
  { id: 'inv-003', code: 5002, name: 'Hina Raso', role: 'Family investor', contactNumber: '0333-4550982', joinedOn: '2025-05-20', note: '' },
]

/* Money put in by investors, and money drawn back out. */
export const investorEntries = [
  { id: 'ive-001', investorId: 'inv-001', date: '2025-04-01', direction: 'in', amount: 400000, note: 'Opening capital' },
  { id: 'ive-002', investorId: 'inv-002', date: '2025-04-15', direction: 'in', amount: 250000, note: 'Capital injection' },
  { id: 'ive-003', investorId: 'inv-003', date: '2025-05-20', direction: 'in', amount: 150000, note: 'Capital injection' },
  { id: 'ive-004', investorId: 'inv-001', date: '2025-06-05', direction: 'out', amount: 60000, note: 'Owner drawings' },
]

/* Monthly sales targets — the legacy "Targets Entry" screen. */
export const targets = [
  { id: 'tgt-001', month: '2025-04', scope: 'company', employeeId: null, amount: 400000, note: '' },
  { id: 'tgt-002', month: '2025-05', scope: 'company', employeeId: null, amount: 500000, note: '' },
  { id: 'tgt-003', month: '2025-06', scope: 'company', employeeId: null, amount: 1400000, note: 'Peak season' },
  { id: 'tgt-004', month: '2025-06', scope: 'employee', employeeId: 'emp-01', amount: 600000, note: 'Ahmed — Karachi route' },
  { id: 'tgt-005', month: '2025-06', scope: 'employee', employeeId: 'emp-05', amount: 450000, note: 'Sana — Lahore route' },
  { id: 'tgt-006', month: '2025-06', scope: 'employee', employeeId: 'emp-06', amount: 350000, note: 'Imran — key accounts' },
]

export const RETURN_REASONS = [
  'Expired', 'Damaged in transit', 'Wrong item supplied', 'Customer cancelled',
  'Short dated', 'Quality complaint', 'Other',
]

/* Goods sent back by customers, and goods we sent back to suppliers. */
export const salesReturns = []
export const purchaseReturns = []

/* Written procedures the business has to keep and follow. */
export const sopDocuments = [
  { id: 'sop-01', code: 'SOP-ST-01', title: 'Receiving and storing medicines', category: 'Storage', version: '2.1', effectiveDate: '2025-01-15', reviewDate: '2026-01-15', owner: 'Usman Tariq', summary: 'How incoming stock is checked against the invoice, batch and expiry recorded, and put away in the correct temperature zone.' },
  { id: 'sop-02', code: 'SOP-CC-02', title: 'Cold chain handling', category: 'Storage', version: '1.4', effectiveDate: '2025-02-01', reviewDate: '2026-02-01', owner: 'Usman Tariq', summary: 'Temperature limits, twice-daily logging, and what to do if the cold room goes out of range.' },
  { id: 'sop-03', code: 'SOP-EX-03', title: 'Expiry control and near-expiry stock', category: 'Quality', version: '3.0', effectiveDate: '2025-03-10', reviewDate: '2026-03-10', owner: 'Fatima Noor', summary: 'Monthly expiry review, moving near-expiry stock first, and returning short-dated goods to the supplier.' },
  { id: 'sop-04', code: 'SOP-RC-04', title: 'Product recall', category: 'Quality', version: '2.0', effectiveDate: '2025-03-10', reviewDate: '2026-03-10', owner: 'Imran Shah', summary: 'Tracing a batch to every customer it went to, issuing the recall notice, and recording what came back.' },
  { id: 'sop-05', code: 'SOP-NC-05', title: 'Controlled medicines register', category: 'Compliance', version: '1.2', effectiveDate: '2025-04-01', reviewDate: '2026-04-01', owner: 'Imran Shah', summary: 'Separate recording of controlled items, licence checks before supply, and monthly reconciliation of the register.' },
  { id: 'sop-06', code: 'SOP-DL-06', title: 'Delivery and proof of receipt', category: 'Distribution', version: '1.1', effectiveDate: '2025-05-01', reviewDate: '2026-05-01', owner: 'Bilal Hussain', summary: 'Loading checks, signed delivery notes, and what happens when a customer refuses part of a delivery.' },
]

/* Salary payments already made this cycle. The employees not listed here are
   deliberately left unpaid so the "Record salary payment" flow has something
   real to do during the demo. */
const salaryPaymentSeeds = [
  { employeeId: 'emp-01', entryDate: '2025-06-01' },
  { employeeId: 'emp-02', entryDate: '2025-06-01' },
  { employeeId: 'emp-05', entryDate: '2025-06-01' },
  { employeeId: 'emp-07', entryDate: '2025-06-01' },
]

/* ------------------------------------------------------------------ */
/* Derivation — keeps stock and cash perfectly consistent with the     */
/* purchases and sales above, so nothing has to be hand-balanced.      */
/* ------------------------------------------------------------------ */

const batchByKey = new Map()
const derivedBatches = []
let batchSeq = 1

for (const purchase of purchaseSeeds) {
  for (const item of purchase.items) {
    const key = item.productId + '::' + item.batchNumber
    let batch = batchByKey.get(key)
    if (!batch) {
      batch = {
        id: 'stb-' + String(batchSeq++).padStart(3, '0'),
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        qtyOnHand: 0,
      }
      batchByKey.set(key, batch)
      derivedBatches.push(batch)
    }
    batch.qtyOnHand += item.qty
  }
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export const purchases = purchaseSeeds.map((purchase) => {
  const items = purchase.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    const value = round2(item.qty * item.unitCost)
    // Tax paid to the supplier on the way in. It is claimed back against the
    // tax charged on sales, so it has to be recorded per line.
    const rate = defaultSettings.inputTaxEnabled && product && product.taxable ? product.salesTaxPercent : 0
    const taxAmount = round2((value * rate) / 100)
    return { ...item, value, taxPercent: rate, taxAmount, lineTotal: round2(value + taxAmount) }
  })
  const subtotal = round2(items.reduce((t, i) => t + i.value, 0))
  const taxTotal = round2(items.reduce((t, i) => t + i.taxAmount, 0))
  return {
    id: purchase.id,
    supplierId: purchase.supplierId,
    purchaseDate: purchase.purchaseDate,
    paymentStatus: purchase.paymentStatus,
    status: 'active',
    items,
    subtotal,
    taxTotal,
    totalAmount: round2(subtotal + taxTotal),
  }
})

const productById = (id) => products.find((p) => p.id === id)

export const sales = saleSeeds.map((sale) => {
  const items = sale.items.map((item) => {
    const batch = batchByKey.get(item.productId + '::' + item.batchNumber)
    const product = productById(item.productId)
    const bonusQty = Number(item.bonusQty) || 0
    // Bonus units leave stock too — they are goods given away.
    batch.qtyOnHand -= item.qty + bonusQty

    const calc = calcLine(
      {
        qty: item.qty,
        bonusQty,
        unitPrice: item.unitPrice,
        mrp: product ? product.mrp : 0,
        taxable: product ? product.taxable : false,
        taxPercent: product ? product.salesTaxPercent : 0,
      },
      defaultSettings,
    )

    return {
      productId: item.productId,
      stockBatchId: batch.id,
      qty: item.qty,
      bonusQty,
      unitPrice: item.unitPrice,
      taxable: Boolean(product && product.taxable),
      taxPercent: calc.taxRate,
      taxAmount: calc.taxAmount,
      lineTotal: calc.lineTotal,
      value: calc.value,
    }
  })

  const buyer = customers.find((c) => c.id === sale.customerId)
  const totals = calcTotals(
    items.map((i) => ({ value: i.value, taxAmount: i.taxAmount, lineTotal: i.lineTotal })),
    {
      taxStatus: buyer ? buyer.taxStatus : 'filer',
      furtherTaxEnabled: defaultSettings.furtherTaxEnabled,
      furtherTaxPercent: defaultSettings.furtherTaxPercent,
    },
  )

  return {
    id: sale.id,
    customerId: sale.customerId,
    saleDate: sale.saleDate,
    paymentStatus: sale.paymentStatus,
    status: 'active',
    items,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    furtherTax: totals.furtherTax,
    furtherTaxPercent: totals.furtherTaxPercent,
    totalAmount: totals.grandTotal,
  }
})

export const stockBatches = derivedBatches

const supplierName = (id) => (suppliers.find((s) => s.id === id) || {}).name || 'Unknown supplier'
const customerName = (id) => (customers.find((c) => c.id === id) || {}).name || 'Unknown customer'
const employeeById = (id) => employees.find((e) => e.id === id)

const unsortedCashEntries = [
  {
    entryDate: openingBalance.date,
    direction: 'in',
    amount: openingBalance.amount,
    referenceType: 'opening',
    referenceId: 'opening-balance',
    note: openingBalance.note,
  },
]

for (const purchase of purchases) {
  // Unpaid purchases sit on credit with the supplier, so no money has moved yet.
  if (purchase.paymentStatus !== 'paid') continue
  unsortedCashEntries.push({
    entryDate: purchase.purchaseDate,
    direction: 'out',
    amount: purchase.totalAmount,
    referenceType: 'purchase',
    referenceId: purchase.id,
    note: 'Purchase from ' + supplierName(purchase.supplierId),
  })
}

for (const sale of sales) {
  // An unpaid sale is money owed to us, not money received.
  if (sale.paymentStatus !== 'paid') continue
  unsortedCashEntries.push({
    entryDate: sale.saleDate,
    direction: 'in',
    amount: sale.totalAmount,
    referenceType: 'sale',
    referenceId: sale.id,
    note: 'Sale to ' + customerName(sale.customerId),
  })
}

for (const entry of investorEntries) {
  const investor = investors.find((i) => i.id === entry.investorId)
  unsortedCashEntries.push({
    entryDate: entry.date,
    direction: entry.direction,
    amount: entry.amount,
    referenceType: 'investor',
    referenceId: entry.investorId,
    note: (entry.direction === 'in' ? 'Capital from ' : 'Drawings by ') + (investor ? investor.name : 'investor'),
  })
}

for (const expense of expenses) {
  unsortedCashEntries.push({
    entryDate: expense.date,
    direction: 'out',
    amount: expense.amount,
    referenceType: 'expense',
    referenceId: expense.id,
    note: expense.category + ' — ' + expense.payee,
  })
}

for (const payment of salaryPaymentSeeds) {
  const employee = employeeById(payment.employeeId)
  unsortedCashEntries.push({
    entryDate: payment.entryDate,
    direction: 'out',
    amount: employee.monthlySalary,
    referenceType: 'salary',
    referenceId: employee.id,
    note: 'Salary — ' + employee.name,
  })
}

export const cashEntries = unsortedCashEntries
  .sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0))
  .map((entry, index) => ({ id: 'cash-' + String(index + 1).padStart(3, '0'), ...entry }))

export const adjustments = []


export const seedData = {
  suppliers,
  customers,
  productGroups,
  products,
  stockBatches,
  purchases,
  sales,
  employees,
  cashEntries,
  adjustments,
  expenses,
  offers,
  investors,
  investorEntries,
  targets,
  salesReturns,
  purchaseReturns,
  sopDocuments,
  settings: defaultSettings,
  openingBalance,
}

export default seedData
