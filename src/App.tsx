import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './utils/hooks/AuthProvider'
import { guestOnlyLoader, protectedLoader } from './utils/auth'
import { useWebSocket } from './utils/hooks/useWebSocket'
import { useListingContext } from './features/listing/ListingContext'
import { ListingProvider } from './features/listing/ListingProvider'
import Layout from './components/layout/Layout'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import HomePage from './features/products/HomePage'
import { homeLoader } from './features/products/homeLoader'
import ProductDetailPage from './features/products/ProductDetailPage'
import { productDetailLoader } from './features/products/productDetailLoader'
import ErrorPage from './components/ErrorPage'
import ListingLayout from './features/listing/ListingLayout'
import UploadPage from './features/listing/UploadPage'
import InfoPage from './features/listing/InfoPage'
import { infoLoader } from './features/listing/infoLoader'
import ConfirmPage from './features/listing/ConfirmPage'
import CompletePage from './features/listing/CompletePage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', loader: homeLoader, element: <HomePage /> },
      { path: '/products/:id', loader: productDetailLoader, element: <ProductDetailPage /> },
      {
        path: '/listing',
        loader: protectedLoader,
        element: <ListingLayout />,
        children: [
          { index: true, element: <Navigate to="upload" replace /> },
          { path: 'upload', element: <UploadPage /> },
          { path: 'info', loader: infoLoader, element: <InfoPage /> },
          { path: 'confirm', element: <ConfirmPage /> },
          { path: 'complete', element: <CompletePage /> },
        ],
      },
    ],
  },
  { path: '/login', loader: guestOnlyLoader, element: <LoginPage /> },
  { path: '/signup', loader: guestOnlyLoader, element: <SignupPage /> },
])

function AppInner() {
  const { dispatch: listingDispatch } = useListingContext()

  useWebSocket({
    onDamageDetectionComplete: payload =>
      listingDispatch({ type: 'DETECTION_COMPLETE', payload }),
    onDamageDetectionFailed: () =>
      listingDispatch({ type: 'DETECTION_FAILED' }),
  })

  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <ListingProvider>
        <AppInner />
      </ListingProvider>
    </AuthProvider>
  )
}
