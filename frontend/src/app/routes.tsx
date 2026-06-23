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

import { MessagesPage } from "./pages/MessagesPage";
import { ProfilePage } from "./pages/ProfilePage";

import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { DonationPage } from "./pages/DonationPage";

import { ManagerDashboard } from "./pages/ManagerDashboard";

import { ExchangeRequestsPage } from "./pages/ExchangeRequestsPage";
import { ExchangeDetailPage } from "./pages/ExchangeDetailPage";
import { ExchangeHistoryPage } from "./pages/ExchangeHistoryPage";

import { CreateOrderPage } from "./pages/CreateOrderPage";

import { TransactionDetailPage } from "./pages/TransactionDetailPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";

import { NotFoundPage } from "./pages/NotFoundPage";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";

/* ===== TASK 19-24 ===== */
import DonationRequest from "./pages/DonationRequest";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Notification from "./pages/Notification";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      /* Home */
      {
        index: true,
        element: <HomePage />,
      },

      /* Auth */
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "forgot-password/verify-otp",
        element: <ForgotPasswordPage />,
      },
      {
        path: "verify-email",
        element: <EmailVerificationPage />,
      },

      /* Product */
      {
        path: "products",
        element: <ProductListingPage />,
      },
      {
        path: "products/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "create-product",
        element: <CreateProductPage />,
      },

      /* Donation */
      {
        path: "donations",
        element: <DonationPage />,
      },
      {
        path: "donation-request/:id",
        element: <DonationRequest />,
      },

      /* Cart */
      {
        path: "cart",
        element: <Cart />,
      },

      /* Checkout */
      {
        path: "checkout",
        element: <Checkout />,
      },

      /* Notification */
      {
        path: "notification",
        element: <Notification />,
      },

      /* Message */
      {
        path: "messages",
        element: <MessagesPage />,
      },

      /* Profile */
      {
        path: "profile/:userId",
        element: <ProfilePage />,
      },

      /* Order */
      {
        path: "orders",
        element: <OrderHistoryPage />,
      },

      /* Exchange */
      {
        path: "exchanges",
        element: <ExchangeRequestsPage />,
      },
      {
        path: "exchanges/:id",
        element: <ExchangeDetailPage />,
      },
      {
        path: "exchange-history",
        element: <ExchangeHistoryPage />,
      },

      /* Escrow */
      {
        path: "create-order",
        element: <CreateOrderPage />,
      },

      /* Transaction */
      {
        path: "transactions",
        element: <TransactionHistoryPage />,
      },
      {
        path: "transactions/:id",
        element: <TransactionDetailPage />,
      },

      /* Manager */
      {
        path: "manager",
        element: <ManagerDashboard />,
      },

      /* Settings */
      {
        path: "account-settings",
        element: <AccountSettingsPage />,
      },

      /* 404 */
      {
        path: "*",
        element: <NotFoundPage />,
      },
      {
  path: "test",
  element: <h1>TEST OK</h1>,
},
    ],
  },
]);
