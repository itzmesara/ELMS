import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, Chip, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const BookDetails = () => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [borrowMessage, setBorrowMessage] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      const response = await api.get(`/books/${id}`);
      setBook(response.data);
    } catch (err) {
      setError('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      await api.post(`/loans/borrow/${id}`);
      setBorrowMessage('Book borrowed successfully!');
      fetchBookDetails(); // Refresh book status
    } catch (err) {
      setBorrowMessage('Failed to borrow book. It may not be available.');
    }
  };

  const handleReserve = async () => {
    try {
      await api.post(`/reservations/reserve/${id}`);
      setBorrowMessage('Book reserved successfully!');
    } catch (err) {
      setBorrowMessage('Failed to reserve book.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!book) return <Alert severity="error">Book not found</Alert>;

  return (
    <Container maxWidth="md">
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            {book.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            by {book.author}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip label={`Category: ${book.category}`} sx={{ mr: 1 }} />
            <Chip label={`Year: ${book.year}`} sx={{ mr: 1 }} />
            <Chip
              label={book.available ? 'Available' : 'Not Available'}
              color={book.available ? 'success' : 'error'}
            />
          </Box>
          <Typography variant="body1" paragraph>
            {book.description}
          </Typography>
          <Box sx={{ mt: 3 }}>
            {borrowMessage && (
              <Alert severity={borrowMessage.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>
                {borrowMessage}
              </Alert>
            )}
            {book.available ? (
              <Button variant="contained" onClick={handleBorrow}>
                Borrow Book
              </Button>
            ) : (
              <Button variant="outlined" onClick={handleReserve}>
                Reserve Book
              </Button>
            )}
            <Button variant="text" onClick={() => navigate('/catalog')} sx={{ ml: 2 }}>
              Back to Catalog
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default BookDetails;
