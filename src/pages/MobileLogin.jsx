import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { PageFade, PressScale } from '../motion/presets'

export default function MobileLogin() {
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phoneNumber)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    
    if (!validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In real implementation, call your OTP service
      // await authService.sendOTP(phone)
      
      toast.success(`OTP sent to +91 ${phone}`)
      setStep('otp')
      setCountdown(30) // 30 seconds countdown
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In real implementation, verify OTP with your service
      // const response = await authService.verifyOTP(phone, otp)
      
      // Mock successful login
      const mockUser = {
        id: Date.now(),
        phone: phone,
        name: `User ${phone.slice(-4)}`,
        isVerified: true
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      // Store in localStorage (your auth service should handle this)
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      toast.success('Login successful!')
      navigate('/')
    } catch (error) {
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('OTP resent successfully')
      setCountdown(30)
    } catch (error) {
      toast.error('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value) => {
    // Remove non-digits and limit to 10 digits
    const digits = value.replace(/\D/g, '').slice(0, 10)
    return digits
  }

  const formatOTP = (value) => {
    // Remove non-digits and limit to 6 digits
    const digits = value.replace(/\D/g, '').slice(0, 6)
    return digits
  }

  return (
    <PageFade className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'phone' ? 'Enter Mobile Number' : 'Verify OTP'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'phone' 
              ? 'We\'ll send you a verification code' 
              : `Enter the 6-digit code sent to +91 ${phone}`
            }
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    placeholder="9876543210"
                    maxLength="10"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit mobile number
                </p>
              </div>

              <PressScale className="block">
                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </PressScale>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(formatOTP(e.target.value))}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-center tracking-widest"
                  placeholder="123456"
                  maxLength="6"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Enter the 6-digit verification code
                </p>
              </div>

              <PressScale className="block">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </PressScale>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setCountdown(0)
                  }}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ← Change mobile number
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Prefer email login?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Login with email
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="link-brand">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="link-brand">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </PageFade>
  )
}