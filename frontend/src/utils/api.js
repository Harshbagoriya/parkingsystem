import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Response interceptor — handle token expiry globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('parksmart_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
