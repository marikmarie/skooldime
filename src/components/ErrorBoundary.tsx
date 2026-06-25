import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {

    if (this.state.hasError) {
      return (
        <div id="error-boundary-screen" className="flex min-h-screen items-center justify-center bg-[#070A13] p-4 font-sans text-gray-200">
          <div className="w-full max-w-lg rounded-xl border border-red-500/30 bg-[#0F1424] p-6 shadow-2xl shadow-red-950/20">
            <div className="flex items-center gap-3 border-b border-red-500/20 pb-4 text-red-400">
              <AlertCircle className="h-6 w-6 stroke-[2]" />
              <h2 className="text-lg font-medium tracking-tight">Runtime Exception Intercepted</h2>
            </div>
            
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              An unhandled crash has occurred inside the React lifecycle. The Error Guardian component successfully caught the exception to prevent a blank iframe lock:
            </p>

            <div className="mt-4 rounded-lg bg-black/40 p-4 font-mono text-xs text-red-300 overflow-x-auto max-h-48 border border-white/5">
              <div className="font-semibold">{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unspecified Error'}</div>
              {this.state.errorInfo?.componentStack && (
                <div className="mt-3 text-[10px] text-gray-500 leading-normal whitespace-pre">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                id="reset-app-btn"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 active:bg-red-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset App State and Try Again
              </button>
              <button
                id="reload-page-btn"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 active:bg-white/5"
              >
                Force Hard Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
