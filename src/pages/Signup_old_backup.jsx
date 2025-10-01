import React, { useState, useEffect, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { animate, createScope, spring, stagger } from 'animejs'
import api from '../api/api.js'
import Loader from '../components/Loader'
import { Link, useNavigate } from 'react-router-dom'

const SignupSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  phone: Yup.string()
    .min(1, 'Phone number is required')
    .max(15, 'Phone number must be less than 15 characters')
    .required('Phone number is required'),
  business_name: Yup.string()
    .max(100, 'Business name must be less than 100 characters')
    .nullable(),
  gstin: Yup.string()
    .max(15, 'GSTIN must be less than 15 characters')
    .nullable(),
})

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const root = useRef(null)
  const scope = useRef(null)

  // Add CSS animations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes floatUp {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes particle-float {
        0% { transform: translateY(100vh) translateX(-5px) rotate(0deg); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-100vh) translateX(5px) rotate(180deg); opacity: 0; }
      }
      
      .floating-element {
        animation: floatUp 12s infinite ease-in-out;
      }
      
      .floating-element:nth-child(2) { animation-delay: -2s; }
      .floating-element:nth-child(3) { animation-delay: -4s; }
      .floating-element:nth-child(4) { animation-delay: -6s; }
      .floating-element:nth-child(5) { animation-delay: -8s; }
      .floating-element:nth-child(6) { animation-delay: -10s; }
      
      .particle {
        animation: particle-float 15s linear infinite;
        pointer-events: none;
      }
      
      .particle:nth-child(odd) { animation-duration: 18s; animation-delay: -2s; }
      .particle:nth-child(even) { animation-duration: 12s; animation-delay: -5s; }
      
      .animated-gradient {
        background: linear-gradient(-45deg, #1a2341, #2d3a5f, #3b4b73, #4a5b88);
        background-size: 400% 400%;
        animation: gradient-shift 8s ease infinite;
      }
      
      .glass-effect {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .shimmer {
        animation: shimmer 2s infinite linear;
        opacity: 0;
      }
      
      .social-btn:hover .shimmer {
        opacity: 1;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(200%) skewX(-12deg); }
      }
      
      .form-field {
        position: relative;
        overflow: hidden;
      }
      
      .form-field::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(127, 211, 247, 0.1), transparent);
        transition: left 0.5s ease;
        pointer-events: none;
      }
      
      .form-field:hover::before {
        left: 100%;
      }
      
      .pulse-effect {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    
    document.head.appendChild(styleSheet);

    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        // Smooth entrance animations
        const formElement = document.querySelector('.signup-form');
        if (Boolean(formElement)) {
          animate('.signup-form', {
            opacity: [0, 1],
            translateY: [30, 0],
            scale: [0.95, 1],
            duration: 800,
            easing: 'spring(1, 80, 10, 0)',
          });
        }

        const titleElement = document.querySelector('.signup-title');
        if (Boolean(titleElement)) {
          animate('.signup-title', {
            opacity: [0, 1],
            translateY: [20, 0],
            scale: [0.9, 1],
            duration: 600,
            delay: 200,
            easing: 'spring(1, 80, 10, 0)',
          });
        }

        const formGroups = document.querySelectorAll('.form-group');
        if (Boolean(formGroups && formGroups.length)) {
          animate('.form-group', {
            opacity: [0, 1],
            translateX: [-20, 0],
            scale: [0.98, 1],
            delay: stagger(100, { start: 400 }),
            duration: 500,
            easing: 'easeOutExpo'
          });
        }

        const submitBtn = document.querySelector('.signup-btn');
        if (Boolean(submitBtn)) {
          animate('.signup-btn', {
            opacity: [0, 1],
            translateY: [20, 0],
            scale: [0.95, 1],
            duration: 600,
            delay: 800,
            easing: 'spring(1, 80, 10, 0)',
          });
        }

        // Floating elements animation
        const floatingElements = document.querySelectorAll('.floating-element');
        if (Boolean(floatingElements && floatingElements.length)) {
          animate('.floating-element', {
            opacity: [0, 0.6],
            scale: [0.8, 1],
            delay: stagger(500, { start: 1000 }),
            duration: 1000,
            easing: 'easeOutCirc'
          });
        }

        // Particle system
        const particles = document.querySelectorAll('.particle');
        if (Boolean(particles && particles.length)) {
          animate('.particle', {
            opacity: [0, 0.4, 0],
            scale: [0.5, 1, 0.5],
            delay: stagger(200, { start: 1500 }),
            duration: 2000,
            easing: 'easeInOutSine'
          });
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      scope.current?.revert();
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setLoading(true)
      
      // Transform values for API
      const signupData = {
        email: values.email,
        password: values.password,
        confirm_password: values.confirm_password,
        phone: values.phone,
        business_name: values.business_name || null,
        gstin: values.gstin || null,
      }
      
      const response = await api.post('/users/signup/', signupData)
      
      if (response.data.success) {
        // Show success message
        console.log('Account created successfully!', response.data.message)
        
        // Navigate to login page with success message
        navigate('/login', { 
          state: { 
            message: response.data.message,
            nextStep: response.data.next_step 
          }
        })
      }
    } catch (error) {
      console.error('Signup error:', error)
      
      if (error.response?.data) {
        // Handle field-specific errors from API
        const errorData = error.response.data
        
        Object.keys(errorData).forEach(field => {
          if (field in values) {
            const errorMessage = Array.isArray(errorData[field]) 
              ? errorData[field][0] 
              : errorData[field]
            setFieldError(field, errorMessage)
          }
        })
        
        // Handle general error message
        if (errorData.detail || errorData.message) {
          setFieldError('general', errorData.detail || errorData.message)
        }
      } else {
        setFieldError('general', 'Account creation failed. Please try again.')
      }
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  return (
    <div ref={root} className="min-h-screen animated-gradient relative overflow-hidden">
      {loading && <Loader />}
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating circles */}
        <div className="floating-element absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="floating-element absolute top-40 right-20 w-48 h-48 bg-[#7fd3f7]/10 rounded-full blur-2xl"></div>
        <div className="floating-element absolute bottom-32 left-1/4 w-40 h-40 bg-white/8 rounded-full blur-xl"></div>
        <div className="floating-element absolute bottom-20 right-1/3 w-24 h-24 bg-[#b6e0f7]/15 rounded-full blur-lg"></div>
        <div className="floating-element absolute top-1/2 left-1/2 w-60 h-60 bg-white/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Animated particles */}
        <div className="particle absolute top-0 left-1/4 w-2 h-2 bg-white/40 rounded-full"></div>
        <div className="particle absolute top-0 right-1/3 w-1.5 h-1.5 bg-[#7fd3f7]/60 rounded-full"></div>
        <div className="particle absolute top-0 left-1/2 w-1 h-1 bg-white/50 rounded-full"></div>
        <div className="particle absolute top-0 right-1/4 w-2.5 h-2.5 bg-[#b6e0f7]/40 rounded-full"></div>
        <div className="particle absolute top-0 left-3/4 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="signup-form glass-effect rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <span className="text-2xl">🚀</span>
                <h1 className="signup-title text-2xl font-bold text-white ml-2">
                  Quick Signup
                </h1>
              </div>
              <p className="text-white/70 text-sm mb-2">
                Minimal friction onboarding - get started in seconds!
              </p>
              <p className="text-white/50 text-xs">
                Complete your profile later • Start creating invoices immediately
              </p>
            </div>

            {/* Signup Form */}
            <Formik
              initialValues={{
                email: '',
                password: '',
                confirm_password: '',
                phone: '',
                business_name: '',
                gstin: ''
              }}
              validationSchema={SignupSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors }) => (
                <Form className="space-y-5">
                  {/* Email Field - Primary Login */}
                  <div className="form-group form-field">
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                      Email Address <span className="text-red-300">*</span>
                    </label>
                    <Field
                      name="email"
                      type="email"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-white placeholder-white/50 transition-all duration-300"
                      placeholder="you@example.com"
                    />
                    <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* Password Field */}
                  <div className="form-group form-field">
                    <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                      Password <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                                 text-white placeholder-white/50 transition-all duration-300"
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* Confirm Password Field */}
                  <div className="form-group form-field">
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-white/90 mb-2">
                      Confirm Password <span className="text-red-300">*</span>
                    </label>
                    <Field
                      name="confirm_password"
                      type="password"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-white placeholder-white/50 transition-all duration-300"
                      placeholder="Confirm your password"
                    />
                    <ErrorMessage name="confirm_password" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* Phone Field */}
                  <div className="form-group form-field">
                    <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                      Phone Number <span className="text-red-300">*</span>
                    </label>
                    <Field
                      name="phone"
                      type="tel"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-white placeholder-white/50 transition-all duration-300"
                      placeholder="+91 9876543210"
                    />
                    <p className="text-xs text-white/40 mt-1">For login recovery & invoice delivery</p>
                    <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* Business Name Field */}
                  <div className="form-group form-field">
                    <label htmlFor="business_name" className="block text-sm font-medium text-white/90 mb-2">
                      Business Name
                    </label>
                    <Field
                      name="business_name"
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-white placeholder-white/50 transition-all duration-300"
                      placeholder="Your Business or Shop Name"
                    />
                    <p className="text-xs text-white/40 mt-1">Appears on invoices & receipts</p>
                    <ErrorMessage name="business_name" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* GSTIN Field - Optional */}
                  <div className="form-group form-field">
                    <label htmlFor="gstin" className="block text-sm font-medium text-white/90 mb-2">
                      GST Number <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <Field
                      name="gstin"
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] 
                               text-white placeholder-white/50 transition-all duration-300"
                      placeholder="22AAAAA0000A1Z5"
                    />
                    <p className="text-xs text-white/40 mt-1">For GST-compliant invoices • Add later if needed</p>
                    <ErrorMessage name="gstin" component="div" className="mt-1 text-sm text-red-300" />
                  </div>

                  {/* General Error */}
                  {errors.general && (
                    <div className="text-red-300 text-sm text-center bg-red-500/10 backdrop-blur-sm border border-red-300/20 rounded-lg p-3">
                      {errors.general}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="signup-btn w-full py-3 px-6 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] 
                             text-[#1a2341] font-semibold rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] 
                             focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 disabled:opacity-50 
                             transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                             relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a7.646 7.646 0 100 15.292 7.646 7.646 0 000-15.292zm0 2.25a5.396 5.396 0 110 10.792 5.396 5.396 0 010-10.792z" />
                          </svg>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🚀</span>
                          Start Free Trial
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 shimmer group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                  </button>
                </Form>
              )}
            </Formik>
            
            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="px-4 text-white/50 text-sm">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
            
            {/* Social Signup */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-4">Sign up with</p>
                <div className="flex justify-center gap-4">
                  <button className="social-btn w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 hover:rotate-3 transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 shimmer"></div>
                    <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button className="social-btn w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 hover:rotate-(-3) transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 shimmer"></div>
                    <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                </div>
                
                {/* Sign in link */}
                <div className="text-center">
                  <span className="text-white/60">Already have an account? </span>
                  <Link
                    to="/login"
                    className="text-[#7fd3f7] font-semibold hover:text-[#b6e0f7] transition-colors duration-300 relative group"
                  >
                    Sign In
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </div>
                
                {/* Additional links */}
                <div className="flex justify-center gap-6 text-sm">
                  <Link to="/terms" className="text-white/50 hover:text-white/80 transition-colors duration-300">
                    Terms of Service
                  </Link>
                  <span className="text-white/30">•</span>
                  <Link to="/privacy" className="text-white/50 hover:text-white/80 transition-colors duration-300">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};