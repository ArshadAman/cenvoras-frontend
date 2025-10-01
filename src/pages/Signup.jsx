import React, { useState, useEffect, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { animate, createScope, spring, stagger } from 'animejs'
import api from '../api/api.js'
import Loader from '../components/Loader'
import { Link, useNavigate } from 'react-router-dom'

const SignupSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string().required('Required'),
  gstin: Yup.string().required('Required'),
  password: Yup.string().min(6, 'Too short!').required('Required'),
})

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const root = useRef(null)
  const scope = useRef(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        // Entrance animations
        animate('.signup-form', {
          opacity: [0, 1],
          translateY: [40, 0],
          scale: [0.95, 1],
          duration: 900,
          easing: spring({ bounce: 0.3 })
        });

        animate('.signup-title', {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 700,
          delay: 200,
          easing: 'outQuart'
        });

        animate('.signup-field', {
          opacity: [0, 1],
          translateX: [-30, 0],
          delay: stagger(120),
          duration: 600,
          easing: 'outQuart'
        });

        animate('.signup-button', {
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: 500,
          delay: 800,
          easing: spring({ bounce: 0.4 })
        });

        // Floating bubbles
        animate('.auth-bubble', {
          translateY: [0, -15, 0],
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
          duration: 5000,
          direction: 'alternate',
          loop: true,
          delay: stagger(700),
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
          <path d="M50,200 Q300,100 500,200 Q700,300 900,200" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.3" />
          <ellipse cx="300" cy="150" rx="350" ry="180" fill="url(#gradient2)" fillOpacity="0.12" />
          <ellipse cx="1100" cy="500" rx="400" ry="200" fill="url(#gradient3)" fillOpacity="0.08" />
          
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
        <div className="auth-bubble absolute top-16 left-20">
          <div className="w-5 h-5 bg-blue-200/30 rounded-full border border-blue-300/40 relative shadow-md">
            <div className="absolute inset-1 bg-blue-100/25 rounded-full"></div>
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/60 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute top-40 right-16">
          <div className="w-3 h-3 bg-cyan-200/35 rounded-full border border-cyan-300/45 relative shadow-sm">
            <div className="absolute inset-0.5 bg-cyan-100/30 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute bottom-32 left-16">
          <div className="w-6 h-6 bg-teal-200/25 rounded-full border border-teal-300/35 relative shadow-lg">
            <div className="absolute inset-1.5 bg-teal-100/20 rounded-full"></div>
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          </div>
        </div>
        <div className="auth-bubble absolute bottom-20 right-20">
          <div className="w-2 h-2 bg-emerald-200/35 rounded-full border border-emerald-300/45"></div>
        </div>
        <div className="auth-bubble absolute top-1/2 left-8">
          <div className="w-4 h-4 bg-purple-200/25 rounded-full border border-purple-300/35 relative">
            <div className="absolute inset-0.5 bg-purple-100/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 pt-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a2341]">Canvoras</span>
        </Link>
        <div className="flex items-center gap-4 text-[#1a2341] font-medium">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/login" className="px-4 py-1 rounded bg-[#eaf6fa] hover:bg-[#d1eaf6] transition">Sign In</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="signup-form bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-lg relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-3 -left-3 w-24 h-24 bg-gradient-to-br from-[#7fd3f7]/20 to-[#b6e0f7]/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-gradient-to-br from-[#1a2341]/10 to-[#7fd3f7]/15 rounded-full blur-lg"></div>
          
          <div className="relative z-10">
            <h2 className="signup-title text-3xl font-bold mb-6 text-[#1a2341] text-center">Join Canvoras</h2>
            <p className="text-[#1a2341]/70 text-center mb-8">Create your account to get started</p>
            
            <Formik
              initialValues={{
                username: '',
                email: '',
                phone: '',
                gstin: '',
                password: '',
              }}
              validationSchema={SignupSchema}
              onSubmit={async (values, { setSubmitting, setFieldError, resetForm }) => {
                setLoading(true)
                try {
                  await api.post('/users/register/', values)
                  resetForm()
                  navigate('/login')
                } catch (error) {
                  setFieldError('username', 'Signup failed')
                }
                setLoading(false)
                setSubmitting(false)
              }}
            >
              {({ isSubmitting }) => (
                <Form className="signup-form w-full space-y-6">
                  {/* Username Field */}
                  <div className="form-group">
                    <label htmlFor="username" className="block text-sm font-medium text-[#1a2341] mb-2">
                      Username
                    </label>
                    <Field
                      name="username"
                      type="text"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#b6e0f7]/30 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-[#1a2341] placeholder-[#1a2341]/50 transition-all duration-300"
                      placeholder="Enter your username"
                    />
                    <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Email Field */}
                  <div className="form-group">
                    <label htmlFor="email" className="block text-sm font-medium text-[#1a2341] mb-2">
                      Email
                    </label>
                    <Field
                      name="email"
                      type="email"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#b6e0f7]/30 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-[#1a2341] placeholder-[#1a2341]/50 transition-all duration-300"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Phone Field */}
                  <div className="form-group">
                    <label htmlFor="phone" className="block text-sm font-medium text-[#1a2341] mb-2">
                      Phone
                    </label>
                    <Field
                      name="phone"
                      type="text"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#b6e0f7]/30 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-[#1a2341] placeholder-[#1a2341]/50 transition-all duration-300"
                      placeholder="Enter your phone number"
                    />
                    <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* GSTIN Field */}
                  <div className="form-group">
                    <label htmlFor="gstin" className="block text-sm font-medium text-[#1a2341] mb-2">
                      GSTIN (Optional)
                    </label>
                    <Field
                      name="gstin"
                      type="text"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#b6e0f7]/30 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-[#1a2341] placeholder-[#1a2341]/50 transition-all duration-300"
                      placeholder="Enter your GSTIN"
                    />
                    <ErrorMessage name="gstin" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Password Field */}
                  <div className="form-group">
                    <label htmlFor="password" className="block text-sm font-medium text-[#1a2341] mb-2">
                      Password
                    </label>
                    <Field
                      name="password"
                      type="password"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#b6e0f7]/30 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-[#1a2341] placeholder-[#1a2341]/50 transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="signup-btn w-full py-3 px-6 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] 
                             text-[#1a2341] font-semibold rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] 
                             focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 disabled:opacity-50 
                             transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </Form>
              )}
            </Formik>
            
            <div className="mt-6 text-center">
              <p className="text-[#1a2341]/70">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1a2341] font-semibold hover:text-[#7fd3f7] transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};