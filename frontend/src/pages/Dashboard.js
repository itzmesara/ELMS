import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      // Fetch user's loans
      const loansResponse = await api.get('/loans/my-loans');
      setLoans(loansResponse.data);
      // Fetch user's reservations
      const reservationsResponse = await api.get('/reservations/my-reservations');
      setUser(prevUser => ({ ...prevUser, reservations: reservationsResponse.data }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
            fontWeight: 600
          }}
        >
          Welcome, {user.name}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleLogout}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.9rem', sm: '0.875rem' }
          }}
        >
          Logout
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 500
                }}
              >
                My Loans
              </Typography>
              {loans.filter(loan => loan.status === 'Active').length === 0 ? (
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No active loans
                </Typography>
              ) : (
                loans.filter(loan => loan.status === 'Active').map((loan) => (
                  <Box
                    key={loan._id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: { xs: '0.95rem', sm: '1rem' }
                      }}
                    >
                      {loan.book.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 1,
                        fontSize: { xs: '0.85rem', sm: '0.875rem' }
                      }}
                    >
                      by {loan.book.author}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'warning.main',
                        fontWeight: 500,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      Due: {new Date(loan.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 500
                }}
              >
                My Wishlist
              </Typography>
              {user.reservations && user.reservations.length === 0 ? (
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No saved books
                </Typography>
              ) : (
                user.reservations && user.reservations.map((reservation) => (
                  <Box
                    key={reservation._id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: { xs: '0.95rem', sm: '1rem' }
                      }}
                    >
                      {reservation.book.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 1,
                        fontSize: { xs: '0.85rem', sm: '0.875rem' }
                      }}
                    >
                      by {reservation.book.author}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 1,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      Reserved on: {new Date(reservation.reservationDate).toLocaleDateString()}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => window.open(reservation.book.fileUrl, '_blank')}
                      disabled={!reservation.book.fileUrl}
                      sx={{
                        mt: 1,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        minWidth: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      {reservation.book.fileType === 'Video' ? 'Watch' : 'Read'}
                    </Button>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
