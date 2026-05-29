import { createBrowserRouter, Navigate } from "react-router";
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
import { AdminDashboard } from "./pages/AdminDashboard";
import { ExchangeRequestsPage } from "./pages/ExchangeRequestsPage";
import { ExchangeDetailPage } from "./pages/ExchangeDetailPage";
import { ExchangeHistoryPage } from "./pages/ExchangeHistoryPage";
import { CreateOrderPage } from "./pages/CreateOrderPage";
import { TransactionDetailPage } from "./pages/TransactionDetailPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "verify-email", Component: EmailVerificationPage },
      { path: "products", Component: ProductListingPage },
      { path: "products/:id", Component: ProductDetailPage },
      { path: "create-product", Component: CreateProductPage },
      { path: "donations", Component: DonationPage },
      { path: "messages", Component: MessagesPage },
      { path: "profile/:userId", Component: ProfilePage },
      { path: "orders", Component: OrderHistoryPage },
      { path: "exchanges", Component: ExchangeRequestsPage },
      { path: "exchanges/:id", Component: ExchangeDetailPage },
      { path: "exchange-history", Component: ExchangeHistoryPage },
      { path: "create-order", Component: CreateOrderPage },
      { path: "transactions", Component: TransactionHistoryPage },
      { path: "transactions/:id", Component: TransactionDetailPage },
      { path: "manager", Component: ManagerDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
