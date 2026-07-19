import { Navigate, Route, Routes } from 'react-router-dom'
import { StoreLayout, AdminLayout } from './layouts/Layouts'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutResultPage from './pages/CheckoutResultPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import MyOrdersPage from './pages/MyOrdersPage'
import OrderPaymentPage from './pages/OrderPaymentPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'

export default function App() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/login" element={<Navigate to="/?login=1" replace />} />

      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="categoria/:id" element={<CategoryPage />} />
        <Route path="produto/:id" element={<ProductPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/sucesso" element={<CheckoutResultPage type="sucesso" />} />
        <Route path="checkout/pendente" element={<CheckoutResultPage type="pendente" />} />
        <Route path="checkout/falha" element={<CheckoutResultPage type="falha" />} />
        <Route path="minha-conta" element={<ProfilePage />} />
        <Route path="meus-pedidos" element={<MyOrdersPage />} />
        <Route path="pedidos/:orderId/pagamento" element={<OrderPaymentPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="usuarios" element={<AdminUsers />} />
      </Route>
    </Routes>
  )
}
