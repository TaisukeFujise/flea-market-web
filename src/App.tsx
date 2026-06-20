import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './utils/hooks/AuthProvider'
import { guestOnlyLoader, protectedLoader } from './utils/auth'
import { useWebSocket } from './utils/hooks/useWebSocket'
import { useListingContext } from './features/listing/ListingContext'
import { ListingProvider } from './features/listing/ListingProvider'
import { MessageProvider } from './utils/hooks/MessageProvider'
import { useMessageContext } from './utils/hooks/MessageContext'
import Layout from './components/layout/Layout'
import MyPageLayout from './components/layout/MyPageLayout'
import { layoutLoader } from './components/layout/layoutLoader'
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
import ProductEditPage from './features/products/ProductEditPage'
import { productEditLoader } from './features/products/productEditLoader'
import PurchasePage from './features/orders/PurchasePage'
import { purchaseLoader } from './features/orders/purchaseLoader'
import PurchaseCompletePage from './features/orders/PurchaseCompletePage'
import MyPage from './features/mypage/MyPage'
import { myPageLoader } from './features/mypage/myPageLoader'
import LikesPage from './features/mypage/LikesPage'
import { likesLoader } from './features/mypage/likesLoader'
import MyListingPage from './features/mypage/MyListingPage'
import { myListingLoader } from './features/mypage/myListingLoader'
import TradesPage from './features/mypage/TradesPage'
import { tradesLoader } from './features/mypage/tradesLoader'
import HistoryPage from './features/mypage/HistoryPage'
import { historyLoader } from './features/mypage/historyLoader'
import TransactionDetailPage from './features/messages/TransactionDetailPage'
import { transactionDetailLoader } from './features/messages/transactionDetailLoader'
import FeedbackPage from './features/orders/FeedbackPage'
import { feedbackLoader } from './features/orders/feedbackLoader'
import { feedbackAction } from './features/orders/feedbackAction'
import FeedbackCompletePage from './features/orders/FeedbackCompletePage'
import DamageReportPage from './features/damages/DamageReportPage'
import { damageReportLoader } from './features/damages/damageReportLoader'

const router = createBrowserRouter([
  {
    id: 'root',
    loader: layoutLoader,
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', loader: homeLoader, element: <HomePage /> },
      { path: '/products/:id', loader: productDetailLoader, element: <ProductDetailPage /> },
      { path: '/mypage/products/:id/edit', loader: productEditLoader, element: <ProductEditPage /> },
      { path: '/products/:id/purchase', loader: purchaseLoader, element: <PurchasePage /> },
      { path: '/purchase/complete', element: <PurchaseCompletePage /> },
      {
        element: <MyPageLayout />,
        children: [
          { path: '/mypage', loader: myPageLoader, element: <MyPage /> },
          { path: '/mypage/likes', loader: likesLoader, element: <LikesPage /> },
          { path: '/mypage/listing', loader: myListingLoader, element: <MyListingPage /> },
          { path: '/mypage/trades', loader: tradesLoader, element: <TradesPage /> },
          { path: '/mypage/history', loader: historyLoader, element: <HistoryPage /> },
          { path: '/orders/:id', loader: transactionDetailLoader, element: <TransactionDetailPage /> },
          { path: '/orders/:id/feedback', loader: feedbackLoader, action: feedbackAction, element: <FeedbackPage /> },
          { path: '/orders/:id/feedback/complete', element: <FeedbackCompletePage /> },
          { path: '/orders/:id/damage-report', loader: damageReportLoader, element: <DamageReportPage /> },
        ],
      },
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
  const { notifyNewMessage } = useMessageContext()

  useWebSocket({
    onNewMessage: notifyNewMessage,
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
        <MessageProvider>
          <AppInner />
        </MessageProvider>
      </ListingProvider>
    </AuthProvider>
  )
}
