import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, Grid, Alert } from '@mui/material';
import api from '../services/api';

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    try {
      const response = await api.get('/loans/my');
      setLoans(response.data);
    } catch (err) {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId) => {
    try {
      await api.post(`/loans/return/${loanId}`);
      fetchMyLoans(); // Refresh the list
    } catch (err) {
      setError('Failed to return book');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        My Loans
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loans.length === 0 ? (
        <Typography>No active loans</Typography>
      ) : (
        <Grid container spacing={3}>
          {loans.map((loan) => (
            <Grid item xs={12} md={6} lg={4} key={loan._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{loan.book.title}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    by {loan.book.author}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Borrowed: {new Date(loan.borrowDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Due: {new Date(loan.dueDate).toLocaleDateString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={new Date(loan.dueDate) < new Date() ? 'error' : 'text.secondary'}
                  >
                    {new Date(loan.dueDate) < new Date() ? 'Overdue' : 'Active'}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleReturn(loan._id)}
                    >
                      Return Book
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

export default MyLoans;
