import { Outlet, useLocation } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../contexts/AuthContext';

export function RootLayout() {
  const location = useLocation();
  const { user } = useAuth();

  // Pages without header
  const noHeaderPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  // Dashboard layouts
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/manager');

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
