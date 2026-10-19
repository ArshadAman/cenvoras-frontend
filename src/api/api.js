import axios from 'axios'

const ENV_API_URL = (import.meta.env.VITE_API_URL || '').trim()
const BASE_URL = ENV_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : null)

if (!BASE_URL) {
  throw new Error('Missing VITE_API_URL for production build')
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Let the browser set multipart boundary; default JSON Content-Type breaks uploads
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else if (config.headers) {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Don't attempt to refresh if the error came from the login endpoint itself
    if (originalRequest.url.includes('/login/')) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = localStorage.getItem('refresh')
      
      if (!refreshToken) {
        console.warn('No refresh token available');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.dispatchEvent(new CustomEvent('cenvora:auth_expired'));
        }
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token...');
        const { data } = await axios.post(`${BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        })
        localStorage.setItem('token', data.access)
        api.defaults.headers.common['Authorization'] = 'Bearer ' + data.access
        processQueue(null, data.access)
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.dispatchEvent(new CustomEvent('cenvora:auth_expired'));
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

if (typeof window !== 'undefined') {
  window.addEventListener('cenvora:auth_recovered', (e) => {
    const newToken = e?.detail?.token;
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      processQueue(null, newToken);
    }
  });
}

export default api