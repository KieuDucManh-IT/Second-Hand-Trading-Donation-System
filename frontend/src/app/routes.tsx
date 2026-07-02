import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "./components/layouts/RootLayout";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";

import { ProductListingPage } from "./pages/ProductListingPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CreateProductPage } from "./pages/CreateProductPage";
import { ProductReviewsPage } from "./pages/ProductReviewsPage";

import { MessagesPage } from "./pages/MessagesPage";
import { ProfilePage } from "./pages/ProfilePage";

import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { DonationPage } from "./pages/DonationPage";

import { ManagerDashboard } from "./pages/ManagerDashboard";

import { ExchangeRequestsPage } from "./pages/ExchangeRequestsPage";
import { ExchangeDetailPage } from "./pages/ExchangeDetailPage";
import { ExchangeHistoryPage } from "./pages/ExchangeHistoryPage";

import { CreateOrderPage } from "./pages/CreateOrderPage";



import { NotFoundPage } from "./pages/NotFoundPage";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";
import WalletPage from "./pages/WalletPage";

import DonationRequestsPage from "./pages/DonationRequestsPage";
import DonationRequest from "./pages/DonationRequest";
import NotificationPage from "./pages/Notification";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "forgot-password/verify-otp", element: <ForgotPasswordPage /> },
      { path: "verify-email", element: <EmailVerificationPage /> },

      { path: "products", element: <ProductListingPage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "products/:id/reviews", element: <ProductReviewsPage /> },
      { path: "create-product", element: <CreateProductPage /> },

      { path: "donations", element: <DonationPage /> },
      { path: "donation-request/:id", element: <DonationRequest /> },
      { path: "donation-requests", element: <DonationRequestsPage /> },

      { path: "messages", element: <MessagesPage /> },
      { path: "profile/:userId", element: <ProfilePage /> },

      { path: "orders", element: <OrderHistoryPage /> },
      { path: "create-order", element: <CreateOrderPage /> },

      { path: "exchanges", element: <ExchangeRequestsPage /> },
      { path: "exchanges/:id", element: <ExchangeDetailPage /> },
      { path: "exchange-history", element: <ExchangeHistoryPage /> },



      { path: "manager", element: <ManagerDashboard /> },
      { path: "account-settings", element: <AccountSettingsPage /> },
      { path: "wallet", element: <WalletPage /> },
      { path: "checkout", element: <CreateOrderPage /> },

      { path: "*", element: <NotFoundPage /> },

      { path: "notifications", element: <NotificationPage /> },
    ],
  },
]);