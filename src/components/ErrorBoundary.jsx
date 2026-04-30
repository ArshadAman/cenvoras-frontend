import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // log to console; in production send to monitoring
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error:', error, info)
    this.setState({ info })
  }

  render() {
    const { error, info } = this.state
    if (error) {
      return (
        <div className="p-6 text-red-300">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">An unexpected error occurred while rendering this page.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary className="cursor-pointer">Error details (expand)</summary>
            <div className="mt-2 text-xs text-red-200">{String(error)}</div>
            {info?.componentStack && <pre className="mt-2 text-xs text-red-200">{info.componentStack}</pre>}
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
