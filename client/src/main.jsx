import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { store } from './redux/store'
import { Toaster } from 'react-hot-toast'
import { WebSocketProvider } from './providers/WebSocketProvider.jsx'
import './index.css'
import App from './App.jsx'
import AuthPage from './pages/Auth.jsx'
import { RequireAuth, PublicRoute } from './components/AuthWrappers.jsx'

import Timer from './components/Timer.jsx'
import RubiksCube from './components/RubiksCube.jsx'
import Ranking from './pages/Ranking.jsx'
import Profile from './pages/Profile'
import Multiplayer from './pages/Multiplayer.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { 
        index: true, 
        element: <Timer /> 
      },
      { 
        path: 'playground', 
        element: <RubiksCube /> 
      },
      { 
        path: 'rankings', 
        element: <Ranking /> 
      },
      { 
        element: <RequireAuth />,
        children: [
          {
            path: 'user/:username', 
            element: <Profile /> 
          },
          {
            path: 'multiplayer',
            element: <Multiplayer />
          }
        ]
      },
    ]
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/auth',
        element: <AuthPage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <WebSocketProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" toastOptions={{ className: 'bg-zinc-900 text-white border border-zinc-800' }} />
      </WebSocketProvider>
    </Provider>
  </StrictMode>,
)
