import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../Header";

export function RootLayout() {
  const location = useLocation();

  const noHeaderPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
  ];

  const showHeader = !noHeaderPaths.includes(location.pathname);

  const isDashboard = location.pathname.startsWith("/manager");

  if (isDashboard) {
    return (
      <div className="min-h-screen">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {showHeader && <Header />}

      <main>
        <Outlet />
      </main>
    </div>
  );
}
