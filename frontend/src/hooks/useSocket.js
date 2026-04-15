import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useSocket(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers)
  handlersRef.current = eventHandlers

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_API_URL || '/', {
        auth: { token: localStorage.getItem('parksmart_token') }
      })
    }
    const socket = socketInstance

    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [])

  return socketInstance
}
