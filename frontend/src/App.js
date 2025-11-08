import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Login from './pages/Login';

import Catalog from './pages/Catalog';
import BookDetails from './pages/BookDetails';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import MyLoans from './pages/MyLoans';
import MyReservations from './pages/MyReservations';
import Reports from './pages/Reports';
import ChangePassword from './pages/ChangePassword';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Deep blue
    },
    secondary: {
      main: '#ff6f00', // Orange accent
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#607d8b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1a237e',
    },
    h5: {
      fontWeight: 500,
      color: '#1a237e',
    },
    h6: {
      fontWeight: 500,
      color: '#2c3e50',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #1a237e 30%, #3949ab 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #3949ab 30%, #1a237e 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          border: '1px solid #e8eaf6',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#c5cae9',
            },
            '&:hover fieldset': {
              borderColor: '#3949ab',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a237e',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #1a237e 30%, #3949ab 90%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#2c3e50',
            borderBottom: '2px solid #e8eaf6',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8f9fa',
          },
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      const verifyToken = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setLoading(false);
      };
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">Loading...</div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Routes>
              <Route
                path="/"
                element={user ? <Navigate to="/catalog" /> : <Navigate to="/login" />}
              />
              <Route
                path="/login"
                element={user ? <Navigate to="/catalog" /> : <Login onLogin={handleLogin} />}
              />

              <Route
                path="/catalog"
                element={user ? <Catalog /> : <Navigate to="/login" />}
              />
              <Route
                path="/book/:id"
                element={user ? <BookDetails /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/my-loans"
                element={user ? <MyLoans /> : <Navigate to="/login" />}
              />
              <Route
                path="/my-reservations"
                element={user ? <MyReservations /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin"
                element={
                  user && (user.role === 'Admin' || user.role === 'Librarian') ? (
                    <AdminPanel />
                  ) : (
                    <Navigate to="/catalog" />
                  )
                }
              />
              <Route
                path="/reports"
                element={
                  user && (user.role === 'Admin' || user.role === 'Librarian') ? (
                    <Reports />
                  ) : (
                    <Navigate to="/catalog" />
                  )
                }
              />
              <Route
                path="/change-password"
                element={user ? <ChangePassword /> : <Navigate to="/login" />}
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
