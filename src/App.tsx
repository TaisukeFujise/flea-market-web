import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './utils/auth'
import { guestOnlyLoader } from './utils/auth'
import Layout from './components/layout/Layout'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import HomePage, { homeLoader } from './features/products/HomePage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', loader: homeLoader, element: <HomePage /> },
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
