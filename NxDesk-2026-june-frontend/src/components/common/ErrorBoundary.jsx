import React from "react";

/**
 * Top-level crash guard. Previously there was no error boundary anywhere
 * in the app - any uncaught render error (a bad API response shape, a
 * missing field, etc.) blanked the entire page to a white screen with no
 * way back except a manual URL change. This catches that and offers a
 * way to recover without losing the whole session.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled UI error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#E3E3E3]">
          <h1 className="text-2xl font-semibold text-[#293988] mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            An unexpected error occurred while displaying this page. Your work elsewhere in the app is unaffected.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-[#104084] text-white py-2 px-6 rounded-lg hover:bg-[#0A3169] transition-colors"
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
