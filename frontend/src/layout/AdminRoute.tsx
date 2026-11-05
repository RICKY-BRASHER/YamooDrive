import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getApiErrorMessage, getCurrentUser, type AuthUser } from '../services/api'

type AccessState =
  | { status: 'loading' }
  | { status: 'allowed'; user: AuthUser }
  | { status: 'guest' }
  | { status: 'denied' }
  | { status: 'error'; message: string }

function AdminRoute() {
  const [access, setAccess] = useState<AccessState>({ status: 'loading' })

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return
        setAccess(
          user
            ? user.role === 'admin'
              ? { status: 'allowed', user }
              : { status: 'denied' }
            : { status: 'guest' },
        )
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setAccess({ status: 'error', message: getApiErrorMessage(error) })
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (access.status === 'loading') {
    return <p role="status" className="p-8 text-center text-sm text-[#777485]">Vérification de votre accès…</p>
  }

  if (access.status === 'guest') {
    return <Navigate to="/?login=1" replace />
  }

  if (access.status === 'denied') {
    return <Navigate to="/" replace />
  }

  if (access.status === 'error') {
    return <p role="alert" className="p-8 text-center text-sm text-red-700">{access.message}</p>
  }

  return <Outlet context={{ user: access.user }} />
}

export default AdminRoute
