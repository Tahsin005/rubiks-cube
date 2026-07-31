import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { store } from './redux/store'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import AuthPage from './pages/Auth.jsx'
import { RequireAuth, PublicRoute } from './components/AuthWrappers.jsx'

import Timer from './components/Timer.jsx'
import RubiksCube from './components/RubiksCube.jsx'
import Ranking from './components/Ranking.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Timer /> },
      { path: 'playground', element: <RubiksCube /> },
      { path: 'rankings', element: <Ranking /> },
      { path: 'multiplayer', element: <div className="text-zinc-400 mt-20 text-center w-full">Multiplayer (Coming Soon)</div> },
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
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ className: 'bg-zinc-900 text-white border border-zinc-800' }} />
    </Provider>
  </StrictMode>,
)
