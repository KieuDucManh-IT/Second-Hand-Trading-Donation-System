import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../Header';

export function RootLayout() {
  const location = useLocation();

  // Pages without header
  const noHeaderPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  // Dashboard layouts
  const isDashboard = location.pathname.startsWith('/manager');

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
