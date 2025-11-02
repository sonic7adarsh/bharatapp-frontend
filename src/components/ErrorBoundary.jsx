import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Optionally log to monitoring service
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-sm">Please try refreshing the page or going back.</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => window.location.reload()} className="px-3 py-2 bg-indigo-600 text-white rounded">Reload</button>
              <a href="/" className="px-3 py-2 border rounded">Go Home</a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}