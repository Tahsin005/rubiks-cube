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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
