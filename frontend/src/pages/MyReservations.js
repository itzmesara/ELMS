import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, Grid, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchMyReservations();
  }, []);

  const fetchMyReservations = async () => {
    try {
      const response = await api.get('/reservations/my');
      setReservations(response.data);
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      await api.delete(`/reservations/${reservationId}`);
      fetchMyReservations(); // Refresh the list
    } catch (err) {
      setError('Failed to cancel reservation');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        My Reservations
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {reservations.length === 0 ? (
        <Typography>No active reservations</Typography>
      ) : (
        <Grid container spacing={3}>
          {reservations.map((reservation) => (
            <Grid item xs={12} md={6} lg={4} key={reservation._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component={Link} to="/catalog" sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    {reservation.book.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    by {reservation.book.author}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Reserved on: {new Date(reservation.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Status: {reservation.status}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleCancelReservation(reservation._id)}
                    >
                      Cancel Reservation
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}


    </Container>
  );
};

export default MyReservations;
