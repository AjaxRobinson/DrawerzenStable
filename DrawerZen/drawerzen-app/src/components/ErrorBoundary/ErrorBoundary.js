import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  background-color: #fffbe6;
  border: 1px solid #facc15;
  border-radius: 8px;
  color: #713f12;
`;

const ErrorTitle = styled.h2`
  color: #b45309;
`;

const ErrorDetails = styled.pre`
  background-color: #fef3c7;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.875rem;
  color: #92400e;
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong.</ErrorTitle>
          <p>An error occurred in the application. Please check the details below.</p>
          <ErrorDetails>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error?.stack}
          </ErrorDetails>
        </ErrorContainer>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;