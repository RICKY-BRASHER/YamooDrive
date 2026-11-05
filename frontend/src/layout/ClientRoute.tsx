import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getApiErrorMessage, getCurrentUser, type AuthUser } from '../services/api'

type ClientAccess =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'client'; user: AuthUser }
  | { status: 'other-role' }
  | { status: 'error'; message: string }

function ClientRoute() {
  const [access, setAccess] = useState<ClientAccess>({ status: 'loading' })

  useEffect(() => {
    let isMounted = true
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return
        setAccess(!user
          ? { status: 'guest' }
          : user.role === 'client'
            ? { status: 'client', user }
            : { status: 'other-role' })
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
  if (access.status === 'guest') return <Navigate to="/?login=1" replace />
  if (access.status === 'other-role') return <Navigate to="/admin" replace />
  if (access.status === 'error') {
    return <p role="alert" className="p-8 text-center text-sm text-red-700">{access.message}</p>
  }
  return <Outlet context={access.user} />
}

export default ClientRoute
