import axios from 'axios'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { API_ORIGIN } from './api'

export type AdminActivity = {
  activity: string
  message: string
  recordId: number | string
  createdAt: string
}

export function subscribeToAdminActivity(
  onActivity: (activity: AdminActivity) => void,
  onConnectionChange: (connected: boolean) => void,
): () => void {
  const key = import.meta.env.VITE_REVERB_APP_KEY
  if (!key) {
    onConnectionChange(false)
    return () => {}
  }

  const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)
  const useTLS = import.meta.env.VITE_REVERB_SCHEME === 'https'
  const echo = new Echo({
    broadcaster: 'reverb',
    key,
    Pusher,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: useTLS,
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        axios.post(
          `${API_ORIGIN}/broadcasting/auth`,
          { socket_id: socketId, channel_name: channel.name },
          {
            withCredentials: true,
            withXSRFToken: true,
            xsrfCookieName: 'XSRF-TOKEN',
            xsrfHeaderName: 'X-XSRF-TOKEN',
          },
        )
          .then(({ data }) => callback(null, data))
          .catch((error: unknown) => callback(error instanceof Error ? error : new Error(String(error)), null))
      },
    }),
  })

  const removeConnectionListener = echo.connector.onConnectionChange((status) => {
    onConnectionChange(status === 'connected')
  })

  echo.private('admin.activity').listen('.admin.activity', onActivity)

  return () => {
    removeConnectionListener()
    echo.leave('admin.activity')
    echo.disconnect()
  }
}
