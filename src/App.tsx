import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './utils/hooks/AuthProvider'
import { guestOnlyLoader } from './utils/auth'
import Layout from './components/layout/Layout'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import HomePage from './features/products/HomePage'
import { homeLoader } from './features/products/homeLoader'
import ProductDetailPage from './features/products/ProductDetailPage'
import { productDetailLoader } from './features/products/productDetailLoader'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', loader: homeLoader, element: <HomePage /> },
      { path: '/products/:id', loader: productDetailLoader, element: <ProductDetailPage /> },
    ],
  },
  { path: '/login', loader: guestOnlyLoader, element: <LoginPage /> },
  { path: '/signup', loader: guestOnlyLoader, element: <SignupPage /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
