import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Catches unhandled render-time errors so the whole app doesn't go blank.
 * Place this at the root (main.jsx) and, optionally, around any
 * sub-tree that should fail gracefully without taking the rest of the UI down.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught render error', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full rounded-3xl border border-rose-200/60 bg-white/80 shadow-lg p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-rose-100 text-rose-600">
              <AlertCircle size={20} />
            </div>
            <h1 className="text-base font-black text-slate-800">
              予期せぬエラーが発生しました
            </h1>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            アプリの表示中に問題が起きました。
            ページを再読み込みすると、ほとんどの場合は解決します。
          </p>
          {this.state.error?.message && (
            <p className="text-[11px] font-mono text-rose-500 bg-rose-50 px-3 py-2 rounded-xl break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} /> 再読み込み
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
