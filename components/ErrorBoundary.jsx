'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // Log to external service if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                काहीतरी चूक झाली!
              </h1>
              <p className="text-gray-600 mb-6">
                आम्ही या समस्येवर काम करत आहोत. कृपया पुन्हा प्रयत्न करा.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Technical Details (Dev Only)
                  </summary>
                  <pre className="text-xs text-red-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={this.handleReset}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>पुन्हा प्रयत्न करा</span>
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Home className="w-5 h-5" />
                  <span>मुख्यपृष्ठावर जा</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
