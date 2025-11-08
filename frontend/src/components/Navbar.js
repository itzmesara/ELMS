import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #ffffff 30%, #e8eaf6 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => navigate(user ? '/catalog' : '/login')}
        >
          📚 E-Library Management System
        </Typography>
        {user ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/catalog')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              E - Resources
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/change-password')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Change Password
            </Button>
            {(user.role === 'Admin' || user.role === 'Librarian') && (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/admin')}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  Admin
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/reports')}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Reports
                </Button>
              </>
            )}
            <Button
              color="inherit"
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(244,67,54,0.1)',
                color: '#ffcdd2',
                '&:hover': {
                  backgroundColor: 'rgba(244,67,54,0.2)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              Login
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
