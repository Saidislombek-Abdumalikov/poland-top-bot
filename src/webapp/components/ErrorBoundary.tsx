import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Mini App:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h2 className="text-base font-extrabold text-slate-900">
              Kutilmagan xatolik yuz berdi
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ilovani qayta yuklash uchun pastdagi tugmani bosing.
            </p>
            {this.state.error && (
              <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-xl text-left font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
          </div>

          <button
            onClick={this.handleReload}
            className="py-2.5 px-5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Qayta yuklash</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
