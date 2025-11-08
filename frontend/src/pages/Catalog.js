import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, TextField, Box, Chip, Button, IconButton } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import api from '../services/api';

const Catalog = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetchBooks();
    fetchWishlist();
  }, []);

  useEffect(() => {
    setFilteredBooks(
      books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [books, searchTerm]);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/reservations/my-reservations');
      setWishlist(response.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (bookId) => {
    const isInWishlist = wishlist.some(item => item.book._id === bookId);
    const reservation = isInWishlist ? wishlist.find(item => item.book._id === bookId) : null;

    try {
      if (isInWishlist) {
        await api.delete(`/reservations/${reservation._id}`);
        setWishlist(prev => prev.filter(item => item.book._id !== bookId));
      } else {
        await api.post('/reservations', { bookId });
        fetchWishlist();
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      fetchWishlist();
    }
  };



  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        E - Resources
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search books by title or author"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>
      <Grid container spacing={3}>
        {filteredBooks.map((book) => (
          <Grid item xs={12} sm={6} md={4} key={book._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {book.title}
                  </Typography>
                  <IconButton
                    onClick={() => toggleWishlist(book._id)}
                    color={wishlist.some(item => item.book._id === book._id) ? 'error' : 'default'}
                  >
                    {wishlist.some(item => item.book._id === book._id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Box>
                <Typography color="textSecondary">
                  by {book.author}
                </Typography>
                <Typography variant="body2" component="p">
                  {book.description}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label={book.category} size="small" />
                  <Chip label={book.year} size="small" sx={{ ml: 1 }} />
                  <Chip label={book.fileType} size="small" sx={{ ml: 1 }} color="secondary" />
                </Box>
                <Typography variant="body2" color={book.availableCopies > 0 ? 'green' : 'red'}>
                  {book.availableCopies > 0 ? 'Available' : 'Borrowed'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.open(book.fileUrl, '_blank')}
                    disabled={!book.fileUrl}
                  >
                    {book.fileType === 'Video' ? 'Watch' : 'Read'}
                  </Button>
                </Box>
              </CardContent>

            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Catalog;
