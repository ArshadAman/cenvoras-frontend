import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import api from '../api/api.js'
import Loader from '../components/Loader'
import { Link, useNavigate } from 'react-router-dom' // import useNavigate

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().min(6, 'Too short!').required('Required'),
})

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const navigate = useNavigate() // initialize navigate

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      {loading && <Loader />}
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Login</h2>
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            setLoading(true)
            try {
              const response = await api.post('/users/login/', values)
              const token = response.data.token || response.data.access
              if (token) {
                localStorage.setItem('token', token)
                if (onLogin) onLogin() // trigger auth state update in App
                navigate('/dashboard')
              } else {
                setFieldError('username', 'No token received')
              }
            } catch (error) {
              setFieldError('username', 'Invalid credentials')
            }
            setLoading(false)
            setSubmitting(false)
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-1">Username</label>
                <Field
                  type="text"
                  name="username"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <ErrorMessage name="username" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-1">Password</label>
                <Field
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
        <div className="mt-4 text-center">
          <span className="text-gray-600 dark:text-gray-300">Don't have an account? </span>
          <Link
            to="/signup"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}