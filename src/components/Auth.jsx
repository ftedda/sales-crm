import React, { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function Auth({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Check your email for a confirmation link!')
      } else {
        const { user } = await signIn(email, password)
        onAuth(user)
      }
    } catch (e) {
      setError(e.message)
    }

    setLoading(false)
  }

  const handleSkip = () => {
    // Allow using app without auth (localStorage only)
    onAuth(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Series B Command Center</h1>
          <p className="text-slate-400">Track your fundraise from start to close</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${error.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleSkip}
              className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
            >
              Continue without account (data saved locally)
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Your fundraise data is encrypted and secure.
        </p>
      </div>
    </div>
  )
}
