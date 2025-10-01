import React, { useState, useEffect, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { animate, createScope, spring, stagger } from 'animejs'
import api from '../api/api.js'
import Loader from '../components/Loader'
import { Link, useNavigate } from 'react-router-dom'

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().min(6, 'Too short!').required('Required'),
})

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const root = useRef(null)
  const scope = useRef(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        // Entrance animations
        animate('.login-form', {
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.95, 1],
          duration: 800,
          easing: spring({ bounce: 0.3 })
        });

        animate('.login-title', {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          delay: 200,
          easing: 'outQuart'
        });

        animate('.login-field', {
          opacity: [0, 1],
          translateX: [-20, 0],
          delay: stagger(150),
          duration: 500,
          easing: 'outQuart'
        });

        animate('.login-button', {
          opacity: [0, 1],
          scale: [0.9, 1],
          duration: 400,
          delay: 600,
          easing: spring({ bounce: 0.4 })
        });

        // Floating bubbles
        animate('.auth-bubble', {
          translateY: [0, -10, 0],
          scale: [1, 1.1, 1],
          duration: 4000,
          direction: 'alternate',
          loop: true,
          delay: stagger(500),
          easing: 'inOutSine'
        });
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      scope.current?.revert();
    };
  }, []);

  return (
    <div ref={root} className="min-h-screen bg-gradient-to-br from-[#f6fcff] via-[#eaf6fa] to-[#eaf6fa] overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      {loading && <Loader />}
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Subtle background paths */}
          <path d="M50,150 Q200,50 350,150 Q500,250 650,150" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.3" />
          <ellipse cx="900" cy="200" rx="400" ry="200" fill="url(#gradient2)" fillOpacity="0.15" />
          <ellipse cx="200" cy="600" rx="300" ry="150" fill="url(#gradient3)" fillOpacity="0.1" />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7fd3f7" />
              <stop offset="100%" stopColor="#1a2341" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b6e0f7" />
              <stop offset="100%" stopColor="#7fd3f7" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eaf6fa" />
              <stop offset="100%" stopColor="#b6e0f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Bubbles */}
      <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden">
        <div className="auth-bubble absolute top-20 left-16">
          <div className="w-4 h-4 bg-blue-200/25 rounded-full border border-blue-300/35 relative shadow-sm">
            <div className="absolute inset-0.5 bg-blue-100/20 rounded-full"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/50 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute top-32 right-20">
          <div className="w-3 h-3 bg-cyan-200/30 rounded-full border border-cyan-300/40 relative shadow-sm">
            <div className="absolute inset-0.5 bg-cyan-100/25 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute bottom-24 left-12">
          <div className="w-5 h-5 bg-teal-200/25 rounded-full border border-teal-300/35 relative shadow-md">
            <div className="absolute inset-1 bg-teal-100/20 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute bottom-32 right-16">
          <div className="w-2 h-2 bg-emerald-200/30 rounded-full border border-emerald-300/40"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 pt-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a2341]">Canvoras</span>
        </Link>
        <div className="flex items-center gap-4 text-[#1a2341] font-medium">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/signup" className="px-4 py-1 rounded bg-[#b6e0f7] text-[#1a2341] font-semibold hover:bg-[#7fd3f7] transition">Sign Up</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="login-form bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-br from-[#7fd3f7]/20 to-[#b6e0f7]/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-[#1a2341]/10 to-[#7fd3f7]/15 rounded-full blur-lg"></div>
          
          <div className="relative z-10">
            <h2 className="login-title text-3xl font-bold mb-8 text-[#1a2341] text-center">Welcome Back</h2>
            <p className="text-[#1a2341]/70 text-center mb-8">Sign in to your Canvoras account</p>
            
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
                    localStorage.setItem('refresh', response.data.refresh)
                    if (onLogin) onLogin()
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
                <Form className="space-y-6">
                  <div className="login-field">
                    <label className="block text-[#1a2341] font-medium mb-2">Username</label>
                    <Field
                      type="text"
                      name="username"
                      className="w-full px-4 py-3 bg-white/70 border-2 border-[#b6e0f7]/50 rounded-2xl focus:outline-none focus:border-[#7fd3f7] focus:bg-white/90 transition-all duration-300 text-[#1a2341] placeholder-[#1a2341]/50"
                      placeholder="Enter your username"
                    />
                    <ErrorMessage name="username" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div className="login-field">
                    <label className="block text-[#1a2341] font-medium mb-2">Password</label>
                    <Field
                      type="password"
                      name="password"
                      className="w-full px-4 py-3 bg-white/70 border-2 border-[#b6e0f7]/50 rounded-2xl focus:outline-none focus:border-[#7fd3f7] focus:bg-white/90 transition-all duration-300 text-[#1a2341] placeholder-[#1a2341]/50"
                      placeholder="Enter your password"
                    />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="login-button w-full py-3 px-6 bg-gradient-to-r from-[#1a2341] to-[#7fd3f7] text-white font-semibold rounded-2xl hover:from-[#22306a] hover:to-[#5fc4f0] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </Form>
              )}
            </Formik>
            
            <div className="mt-8 text-center">
              <span className="text-[#1a2341]/70">Don't have an account? </span>
              <Link
                to="/signup"
                className="text-[#1a2341] font-semibold hover:text-[#7fd3f7] transition-colors duration-300 underline decoration-[#7fd3f7]/50 hover:decoration-[#7fd3f7]"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}