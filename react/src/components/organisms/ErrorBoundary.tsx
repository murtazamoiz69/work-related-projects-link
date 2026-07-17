import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/** Wraps route UI so a render error shows a fallback instead of a blank screen.
 *  Required by CLAUDE.md for all route UI. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          role="alert"
          className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <h1 className="text-2xl font-semibold text-text-primary">
            Something went wrong
          </h1>
          <p className="text-sm text-text-secondary">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
