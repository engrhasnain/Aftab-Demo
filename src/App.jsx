import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router-dom'
import Layout from './components/Layout'

import Dashboard from './pages/Dashboard'
import Suppliers from './pages/Suppliers'
import SupplierDetail from './pages/SupplierDetail'
import SupplierForm from './pages/SupplierForm'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import CustomerForm from './pages/CustomerForm'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import ProductForm from './pages/ProductForm'
import Purchases from './pages/Purchases'
import PurchaseDetail from './pages/PurchaseDetail'
import PurchaseNew from './pages/PurchaseNew'
import Sales from './pages/Sales'
import SaleDetail from './pages/SaleDetail'
import SaleNew from './pages/SaleNew'
import Stock from './pages/Stock'
import CashLedger from './pages/CashLedger'
import MoneyOwed from './pages/MoneyOwed'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Offers from './pages/Offers'
import Compliance from './pages/Compliance'
import Openings from './pages/Openings'
import Settings from './pages/Settings'
import PrintDoc from './pages/PrintDoc'
import Returns from './pages/Returns'
import Investors from './pages/Investors'
import Targets from './pages/Targets'
import Employees from './pages/Employees'
import EmployeeForm from './pages/EmployeeForm'
import EmployeeDetail from './pages/EmployeeDetail'

/* A data router (rather than plain <BrowserRouter>) so forms can block
   navigation when they have unsaved work in them. Exported separately from the
   router itself so tests can mount the same tree in a memory router. */
export const routes = createRoutesFromElements(
  (
    <Route>
      {/* Printable documents render on their own, with no menu around them. */}
      <Route path="/print/:kind/:id" element={<PrintDoc />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/new" element={<SupplierForm />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route path="/suppliers/:id/edit" element={<SupplierForm />} />

        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />

        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />

        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/new" element={<PurchaseNew />} />
        <Route path="/purchases/:id" element={<PurchaseDetail />} />

        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/new" element={<SaleNew />} />
        <Route path="/sales/:id" element={<SaleDetail />} />

        <Route path="/returns" element={<Returns />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/cash" element={<CashLedger />} />
        <Route path="/money-owed" element={<MoneyOwed />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/openings" element={<Openings />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/new" element={<EmployeeForm />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/employees/:id/edit" element={<EmployeeForm />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  ),
)

// Created on first render rather than at import time, so simply importing this
// module never touches the browser history API.
let router = null

export default function App() {
  if (!router) router = createBrowserRouter(routes)
  return <RouterProvider router={router} />
}
