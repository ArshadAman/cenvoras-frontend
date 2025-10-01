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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        animation: gradient-shift 8s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .particle {
        animation: particle-float 15s infinite linear;
      }
      
      .particle:nth-child(1) { animation-delay: -3s; }
      .particle:nth-child(2) { animation-delay: -8s; }
      .particle:nth-child(3) { animation-delay: -12s; }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        // Card appears immediately - no delay for user efficiency
        animate('.signup-container', {
          opacity: [0, 1],
          duration: 300,
          easing: 'outQuart'
        });

        // Brand logo appears quickly
        animate('.signup-brand', {
          opacity: [0, 1],
          duration: 400,
          delay: 100,
          easing: 'outCubic'
        });

        // Title appears fast
        animate('.signup-title', {
          opacity: [0, 1],
          duration: 400,
          delay: 200,
          easing: 'outCubic'
        });

        // Form groups appear in sequence
        const formGroups = document.querySelectorAll('.form-group');
        if (Boolean(formGroups && formGroups.length)) {
          animate('.form-group', {
            opacity: [0, 1],
            translateY: [15, 0],
            delay: stagger(80, { start: 300 }),
            duration: 400,
            easing: 'outCubic'
          });
        }

        // Submit button appears last
        const submitBtn = document.querySelector('.signup-button');
        if (Boolean(submitBtn)) {
          animate('.signup-button', {
            opacity: [0, 1],
            translateY: [20, 0],
            scale: [0.95, 1],
            duration: 500,
            delay: 600,
            easing: 'spring(1, 80, 10, 0)',
          });
        }

        // Footer elements
        const footer = document.querySelector('.signup-footer');
        if (Boolean(footer)) {
          animate('.signup-footer', {
            opacity: [0, 1],
            duration: 600,
            delay: 700,
            easing: 'outCubic'
          });
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      scope.current?.revert();
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
    <div ref={root} className="min-h-screen bg-gradient-to-br from-[#1a2341] via-[#2d3a5f] to-[#1a2341] relative overflow-hidden">
      {loading && <Loader />}
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Subtle moving paths */}
          <path d="M-200,100 Q200,50 600,100 Q1000,150 1600,100" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.4" />
          <path d="M-100,300 Q300,250 700,300 Q1100,350 1500,300" stroke="url(#gradient2)" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M0,600 Q360,450 720,600 Q1080,750 1440,600" stroke="url(#gradient3)" strokeWidth="1" fill="none" opacity="0.3" className="bg-orb" strokeDasharray="6,4" />
          
          {/* Animated geometric patterns */}
          <circle cx="200" cy="150" r="3" fill="#7fd3f7" opacity="0.8" className="floating-element">
            <animate attributeName="r" values="2;5;2" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="800" cy="300" r="4" fill="#b6e0f7" opacity="0.7" className="floating-element">
            <animate attributeName="cy" values="300;280;300" dur="6s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.5;1;0.5" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="1200" cy="500" r="2.5" fill="#eaf6fa" opacity="0.8" className="floating-element">
            <animate attributeName="cx" values="1200;1220;1200" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="400" cy="650" r="2" fill="#7fd3f7" opacity="0.6" className="floating-element">
            <animate attributeName="r" values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
          </circle>
          
          {/* Additional animated elements */}
          <rect x="100" y="100" width="4" height="4" fill="#b6e0f7" opacity="0.5" className="floating-element" transform="rotate(45)">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite" />
          </rect>
          <rect x="1300" y="400" width="3" height="3" fill="#7fd3f7" opacity="0.6" className="floating-element" transform="rotate(-45)">
            <animateTransform attributeName="transform" type="rotate" values="360;0" dur="8s" repeatCount="indefinite" />
          </rect>
          
          {/* Pulsing lines */}
          <line x1="50" y1="50" x2="150" y2="100" stroke="#7fd3f7" strokeWidth="1" opacity="0.4" className="floating-element">
            <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="1300" y1="700" x2="1400" y2="650" stroke="#b6e0f7" strokeWidth="1" opacity="0.3" className="floating-element">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
          </line>
          
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#7fd3f7" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7fd3f7" />
              <stop offset="50%" stopColor="#b6e0f7" />
              <stop offset="100%" stopColor="#eaf6fa" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b6e0f7" />
              <stop offset="100%" stopColor="#7fd3f7" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eaf6fa" />
              <stop offset="100%" stopColor="#b6e0f7" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.03" />
        </svg>
        
        {/* Additional floating elements for more dynamic feel */}
        <div className="floating-element absolute top-1/3 right-8">
          <div className="w-6 h-6 bg-gradient-to-r from-[#7fd3f7]/40 to-[#eaf6fa]/60 rounded-full shadow-lg animate-pulse">
            <div className="absolute inset-1 bg-white/20 rounded-full"></div>
          </div>
        </div>
        
        <div className="floating-element absolute top-2/3 left-20">
          <div className="w-4 h-12 bg-gradient-to-b from-[#b6e0f7]/50 to-transparent rounded-full shadow-md"></div>
        </div>
        
        <div className="floating-element absolute bottom-1/3 right-24">
          <div className="w-8 h-2 bg-gradient-to-r from-[#1a2341]/30 to-[#7fd3f7]/40 rounded-full shadow-sm"></div>
        </div>
        
        <div className="floating-element absolute top-1/2 left-4">
          <div className="w-5 h-5 bg-[#eaf6fa]/40 rounded-lg shadow-md rotate-45 border border-[#b6e0f7]/30">
            <div className="absolute inset-0.5 bg-gradient-to-br from-white/30 to-transparent rounded-sm"></div>
          </div>
        </div>
        
        <div className="floating-element absolute bottom-20 right-8">
          <div className="flex space-x-1">
            <div className="w-2 h-6 bg-[#7fd3f7]/40 rounded-full"></div>
            <div className="w-2 h-4 bg-[#b6e0f7]/50 rounded-full"></div>
            <div className="w-2 h-8 bg-[#eaf6fa]/30 rounded-full"></div>
          </div>
        </div>
        
        <div className="floating-element absolute top-16 left-1/3">
          <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#7fd3f7]/60 to-transparent rounded-full"></div>
        </div>
        
        {/* Animated Particles */}
        <div className="particle absolute left-10 w-1 h-1 bg-[#7fd3f7]/60 rounded-full"></div>
        <div className="particle absolute left-20 w-2 h-2 bg-[#b6e0f7]/40 rounded-full"></div>
        <div className="particle absolute left-32 w-1.5 h-1.5 bg-[#eaf6fa]/50 rounded-full"></div>
        <div className="particle absolute right-16 w-1 h-1 bg-[#7fd3f7]/70 rounded-full"></div>
        <div className="particle absolute right-28 w-2 h-2 bg-[#b6e0f7]/30 rounded-full"></div>
        <div className="particle absolute right-40 w-1.5 h-1.5 bg-[#eaf6fa]/60 rounded-full"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-8 pt-8">
        <Link to="/" className="signup-brand flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] bg-clip-text text-transparent">
            Cenvora
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="text-[#7fd3f7] hover:text-[#b6e0f7] transition-colors duration-300 font-medium relative group"
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-semibold rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-6">
        <div className="signup-container w-full max-w-4xl">
          {/* Glass morphism card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 lg:p-10 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-[#7fd3f7]/30 to-[#b6e0f7]/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-gradient-to-tl from-[#1a2341]/20 to-[#7fd3f7]/25 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-[#b6e0f7]/15 to-[#eaf6fa]/10 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 shimmer"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="signup-title gradient-text text-3xl lg:text-4xl font-bold mb-3">
                  🚀 Quick Signup
                </h2>
                <p className="signup-subtitle text-[#b6e0f7]/80 text-base lg:text-lg">
                  Start your free trial in seconds
                </p>
                <div className="w-16 h-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full mx-auto mt-3"></div>
              </div>
              
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
                    {/* Primary Fields Grid - Required Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Email Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Field
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300 group"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>

                      {/* Phone Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Field
                            type="tel"
                            name="phone"
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <p className="text-white/40 text-xs mt-1">For login recovery & invoice delivery</p>
                        <ErrorMessage name="phone" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>
                    </div>

                    {/* Password Fields Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Password Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Field
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="At least 8 characters"
                            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors duration-200"
                          >
                            {showPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>

                      {/* Confirm Password Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Field
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            placeholder="Confirm your password"
                            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors duration-200"
                          >
                            {showConfirmPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <ErrorMessage name="confirm_password" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>
                    </div>

                    {/* Business Fields Grid - Optional Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Business Name Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          Business Name <span className="text-white/40 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Field
                            type="text"
                            name="business_name"
                            placeholder="Your Business or Shop Name"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <p className="text-white/40 text-xs mt-1">Appears on invoices & receipts</p>
                        <ErrorMessage name="business_name" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>

                      {/* GSTIN Field */}
                      <div className="form-group group">
                        <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">
                          GST Number <span className="text-white/40 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Field
                            type="text"
                            name="gstin"
                            placeholder="22AAAAA0000A1Z5"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7fd3f7]/0 via-[#7fd3f7]/10 to-[#7fd3f7]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        <p className="text-white/40 text-xs mt-1">For GST-compliant invoices • Add later if needed</p>
                        <ErrorMessage name="gstin" component="div" className="text-red-400 text-xs mt-1 font-medium" />
                      </div>
                    </div>

                    {/* General Error */}
                    {errors.general && (
                      <div className="text-red-300 text-sm text-center bg-red-500/10 backdrop-blur-sm border border-red-300/20 rounded-lg p-3 mt-4">
                        {errors.general}
                      </div>
                    )}
                    
                    {/* Signup Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="signup-button w-full py-3.5 px-6 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold text-base lg:text-lg rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-6"
                    >
                      <span className="relative z-10">
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-[#1a2341]/30 border-t-[#1a2341] rounded-full animate-spin"></div>
                            Creating Account...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>🚀</span>
                            Start Free Trial
                          </div>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </button>
                  </Form>
                )}
              </Formik>
              
              {/* Footer */}
              <div className="signup-footer mt-6 text-center space-y-4">
                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <span className="text-white/50 text-sm font-medium">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
                
                {/* Animated Social Login Options */}
                <div className="flex justify-center gap-4">
                  <button className="social-btn w-10 h-10 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 hover:rotate-3 transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 shimmer"></div>
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white/70 group-hover:text-white transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button className="social-btn w-10 h-10 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 hover:rotate-(-3) transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 shimmer"></div>
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white/70 group-hover:text-white transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                </div>
                
                {/* Sign in link */}
                <div className="text-center">
                  <span className="text-white/60 text-sm">Already have an account? </span>
                  <Link
                    to="/login"
                    className="text-[#7fd3f7] font-semibold hover:text-[#b6e0f7] transition-colors duration-300 relative group text-sm"
                  >
                    Sign In
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </div>
                
                {/* Additional links */}
                <div className="flex justify-center gap-4 text-xs lg:gap-6 lg:text-sm">
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