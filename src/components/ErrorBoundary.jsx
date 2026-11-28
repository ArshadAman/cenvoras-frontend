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
        <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger)] flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
              This view ran into an unexpected issue
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              Your saved ledger records and local drafts remain intact. Reloading this screen usually resolves the issue right away.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary !text-sm"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ error: null, info: null })
                  window.location.assign('/dashboard')
                }}
                className="btn-secondary !text-sm"
              >
                Return to Dashboard
              </button>
            </div>
            <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/60 p-3 text-xs text-[var(--text-muted)]" style={{ whiteSpace: 'pre-wrap' }}>
              <summary className="cursor-pointer font-semibold text-[var(--text-secondary)] select-none">
                Technical details (for support)
              </summary>
              <div className="mt-2 font-mono text-[var(--status-danger)] break-words">{String(error)}</div>
              {info?.componentStack && (
                <pre className="mt-2 font-mono text-[11px] text-[var(--text-muted)] overflow-x-auto">{info.componentStack}</pre>
              )}
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
