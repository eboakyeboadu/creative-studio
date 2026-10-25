import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-black text-white p-4">
          <div className="bg-red-950 p-6 rounded-2xl max-w-md w-full border border-red-800 text-center space-y-4 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">App Health Check Failed</h2>
            <p className="text-sm text-gray-300">
              The application encountered a critical runtime error. This safeguard prevents the 
              entire app from appearing blank or "deleted".
            </p>
            
            <div className="bg-black/50 p-2 rounded text-left text-xs font-mono text-red-400 overflow-auto max-h-32 mb-4">
              {this.state.errorStr}
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reload Application
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }} 
              className="w-full flex justify-center items-center gap-2 bg-transparent text-gray-400 hover:text-white p-2 text-xs transition-colors mt-2 underline"
            >
              Factory Reset Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

