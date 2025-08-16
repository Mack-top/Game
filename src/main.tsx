import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate, // Import Navigate for redirection
} from "react-router-dom";
import { ThemeProvider } from './components/theme-provider.tsx'; // Add ThemeProvider import
import cloudbase from '@cloudbase/js-sdk'; // Import CloudBase SDK
import ProtectedRoute from './components/protected-route.tsx'; // Import ProtectedRoute
import { AuthProvider } from './context/AuthContext.tsx'; // Import AuthProvider

import Overview from './pages/overview.tsx';
import ProjectDetails from './pages/project-details.tsx';
import AssetManagement from './pages/asset-management.tsx';
import GameplayManagement from './pages/gameplay-management.tsx';
import DatabaseManagement from './pages/database-management.tsx';
import ProjectDashboard from './pages/project-dashboard.tsx';
import Login from './pages/login.tsx'; // Import Login page
import Register from './pages/register.tsx'; // Import Register page
import Profile from './pages/profile.tsx';
import Settings from './pages/settings.tsx';
import Home from './pages/home.tsx'; // Import Home page for player
import GameLibrary from './pages/game-library.tsx'; // Import GameLibrary page
import GameDetail from './pages/game-detail.tsx'; // Import GameDetail page
import UserProfile from './pages/user-profile.tsx'; // Import UserProfile page
import UserManagement from './pages/user-management.tsx'; // Import UserManagement page

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Navigate to="/home" replace />, // Redirect root to player Home
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      // Protected routes start here
      {
        // Routes accessible to any authenticated user (e.g., profile, settings)
        element: <ProtectedRoute />,
        children: [
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/settings",
            element: <Settings />,
          },
        ],
      },
      {
        // Player-specific protected routes
        element: <ProtectedRoute requiredRole="player" />,
        children: [
          {
            path: "/home",
            element: <Home />,
          },
          {
            path: "/games",
            element: <GameLibrary />,
          },
          {
            path: "/games/:gameId",
            element: <GameDetail />,
          },
          {
            path: "/player-profile",
            element: <UserProfile />,
          },
        ],
      },
      {
        // Admin-specific protected routes
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          {
            path: "/admin/overview",
            element: <Overview />,
          },
          {
            path: "/admin/users", // New route for User Management
            element: <UserManagement />,
          },
          {
            path: "/admin/project/:projectId",
            element: <ProjectDetails />,
            children: [
              {
                index: true,
                element: <ProjectDashboard />,
              },
              {
                path: "dashboard",
                element: <ProjectDashboard />,
              },
              {
                path: "assets",
                element: <AssetManagement />,
              },
              {
                path: "gameplay",
                element: <GameplayManagement />,
              },
              {
                path: "database",
                element: <DatabaseManagement />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

// Initialize CloudBase SDK
// Replace 'YOUR_CLOUD_BASE_ENV_ID' with your actual CloudBase environment ID
cloudbase.init({
  env: 'YOUR_CLOUD_BASE_ENV_ID'
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
