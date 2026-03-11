import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './index';
import { AuthContext } from '../context/AuthContext';

// Mock the page components
jest.mock('../modules/home/Home', () => {
  return function Home() {
    return <div>Home Page</div>;
  };
});

jest.mock('../modules/auth/Login', () => {
  return function Login() {
    return <div>Login Page</div>;
  };
});

jest.mock('../modules/auth/Register', () => {
  return function Register() {
    return <div>Register Page</div>;
  };
});

jest.mock('../modules/profile/Profile', () => {
  return function Profile() {
    return <div>Profile Page</div>;
  };
});

const mockAuthContextValue = (isAuthenticated = false) => ({
  user: isAuthenticated ? { fullName: 'Test User', email: 'test@example.com' } : null,
  token: isAuthenticated ? 'fake-token' : null,
  isAuthenticated,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  loading: false,
});

describe('AppRoutes', () => {
  test('renders home page at root path', () => {
    window.history.pushState({}, 'Home', '/');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(false)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  test('renders login page when not authenticated', () => {
    window.history.pushState({}, 'Login', '/login');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(false)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders register page when not authenticated', () => {
    window.history.pushState({}, 'Register', '/register');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(false)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  test('redirects to login when accessing profile without authentication', () => {
    window.history.pushState({}, 'Profile', '/profile');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(false)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Should redirect to login, so we should NOT see Profile Page
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  test('renders profile page when authenticated', () => {
    window.history.pushState({}, 'Profile', '/profile');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(true)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  test('redirects to home when accessing login while authenticated', () => {
    window.history.pushState({}, 'Login', '/login');
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue(true)}>
          <AppRoutes />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Should redirect to home, so we should NOT see Login Page
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
