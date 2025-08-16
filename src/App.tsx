import { Outlet, useLocation } from 'react-router-dom'; // Import useLocation
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {isAuthPage ? (
        <Outlet /> // Render only Outlet for auth pages
      ) : (
        <Layout>
          <Outlet />
        </Layout>
      )}
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
