import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getApiErrorMessage, getCurrentUser, type AuthUser } from '../services/api'

type HomeAccess =
  | { status: 'loading' }
  | { status: 'ready'; user: AuthUser | null }
  | { status: 'error'; message: string }

function PublicHomeRoute() {
  const [access, setAccess] = useState<HomeAccess>({ status: 'loading' })

  useEffect(() => {
    let isMounted = true
    getCurrentUser()
      .then((user) => {
        if (isMounted) setAccess({ status: 'ready', user })
      })
      .catch((error: unknown) => {
        if (isMounted) setAccess({ status: 'error', message: getApiErrorMessage(error) })
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (access.status === 'loading') {
    return <p role="status" className="p-8 text-center text-sm text-[#777485]">Vérification de votre session…</p>
  }
  if (access.status === 'error') {
    return <p role="alert" className="p-8 text-center text-sm text-red-700">{access.message}</p>
  }
  if (access.user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}

export default PublicHomeRoute
