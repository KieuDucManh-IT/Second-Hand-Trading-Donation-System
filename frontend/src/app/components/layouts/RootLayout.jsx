<<<<<<< Updated upstream:frontend/src/app/components/layouts/RootLayout.tsx
import { Outlet, useLocation } from 'react-router';
import { Header } from '../Header';
=======
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../Header";
>>>>>>> Stashed changes:frontend/src/app/components/layouts/RootLayout.jsx

export function RootLayout() {
  const location = useLocation();

  // Pages without header
  const noHeaderPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  const showHeader = !noHeaderPaths.includes(location.pathname);

<<<<<<< Updated upstream:frontend/src/app/components/layouts/RootLayout.tsx
  // Dashboard layouts
  const isDashboard = location.pathname.startsWith('/manager');
=======
  const isDashboard = location.pathname.startsWith("/manager");
>>>>>>> Stashed changes:frontend/src/app/components/layouts/RootLayout.jsx

  if (isDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {showHeader && <Header />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
