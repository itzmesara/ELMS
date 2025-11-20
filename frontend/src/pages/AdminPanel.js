import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Tabs, Tab, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, InputAdornment, Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [bookSearch, setBookSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', description: '', category: '', year: '', isbn: '',
    fileUrl: '', fileType: 'PDF', totalCopies: 1, availableCopies: 1
  });
  const [bookError, setBookError] = useState('');
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanForm, setLoanForm] = useState({
    userId: '',
    bookId: '',
    dueDate: '',
    status: 'Active'
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'User'
  });
  const [userError, setUserError] = useState('');

  useEffect(() => {
    if (tabValue === 0) fetchBooks();
    else if (tabValue === 1) fetchUsers();
    else if (tabValue === 2) {
      fetchLoans();
      fetchUsers(); // Also fetch users for loan dialog
    }
  }, [tabValue, bookSearch, userSearch, loanSearch]);

  const fetchBooks = async () => {
    try {
      const params = bookSearch ? { search: bookSearch } : {};
      const response = await api.get('/books', { params });
      setBooks(response.data.books);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = userSearch ? { search: userSearch } : {};
      const response = await api.get('/auth/users', { params });
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const params = loanSearch ? { search: loanSearch } : {};
      const response = await api.get('/loans', { params });
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (book = null) => {
    setEditingBook(book);
    setBookForm(book ? { ...book } : { title: '', author: '', description: '', category: '', year: '', isbn: '', fileUrl: '', fileType: 'PDF', totalCopies: 1, availableCopies: 1, price: 0 });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingBook(null);
    setBookError('');
  };

  const handleSaveBook = async () => {
    try {
      if (editingBook) {
        await api.put(`/books/${editingBook._id}`, bookForm);
      } else {
        await api.post('/books', bookForm);
      }
      fetchBooks();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving book:', error);
      const data = error.response?.data;
      if (data?.errors) {
        setBookError(data.errors.map(e => e.msg).join(', '));
      } else {
        setBookError(data?.message || 'Failed to save book');
      }
    }
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.delete(`/books/${id}`);
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleReturnBook = async (loanId) => {
    if (window.confirm('Are you sure you want to return this book?')) {
      try {
        await api.post(`/loans/return/${loanId}`);
        fetchLoans();
        fetchBooks(); // Refresh books to update available copies
      } catch (error) {
        console.error('Error returning book:', error);
      }
    }
  };

  const handleExtendLoan = async (loanId) => {
    if (window.confirm('Are you sure you want to extend this loan by 7 days?')) {
      try {
        await api.put(`/loans/extend/${loanId}`);
        fetchLoans();
      } catch (error) {
        console.error('Error extending loan:', error);
      }
    }
  };

  const handleOpenLoanDialog = (loan = null) => {
    setEditingLoan(loan);
    setLoanForm(loan ? {
      userId: loan.user._id,
      bookId: loan.book._id,
      dueDate: new Date(loan.dueDate).toISOString().split('T')[0],
      status: loan.status
    } : {
      userId: '',
      bookId: '',
      dueDate: '',
      status: 'Active'
    });
    setLoanDialogOpen(true);
  };

  const handleCloseLoanDialog = () => {
    setLoanDialogOpen(false);
    setEditingLoan(null);
  };

  const handleSaveLoan = async () => {
    try {
      if (editingLoan) {
        await api.put(`/loans/${editingLoan._id}`, {
          dueDate: new Date(loanForm.dueDate),
          status: loanForm.status
        });
        fetchLoans();
        fetchBooks(); // Refresh books to update available copies if status changed
      } else {
        await api.post('/loans', {
          userId: loanForm.userId,
          bookId: loanForm.bookId,
          dueDate: loanForm.dueDate,
          status: loanForm.status
        });
        fetchLoans();
        fetchBooks(); // Refresh books to update available copies
      }
      handleCloseLoanDialog();
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      await api.post('/auth/add-user', userForm);
      fetchUsers();
      setUserDialogOpen(false);
      setUserForm({ name: '', email: '', role: 'User' });
      setUserError('');
    } catch (error) {
      console.error('Error saving user:', error);
      setUserError(error.response?.data?.message || 'Failed to save user');
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Books Management" />
          <Tab label="Users Management" />
          <Tab label="Loans Management" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button variant="contained" onClick={() => handleOpenDialog()}>
              Add New Book
            </Button>
            <TextField
              label="Search Books"
              variant="outlined"
              size="small"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>{book.available ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenDialog(book)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteBook(book._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button variant="contained" onClick={() => setUserDialogOpen(true)}>
              Add New User
            </Button>
            <TextField
              label="Search Users"
              variant="outlined"
              size="small"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        size="small"
                      >
                        <MenuItem value="User">User</MenuItem>
                        <MenuItem value="Librarian">Librarian</MenuItem>
                        <MenuItem value="Admin">Admin</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="error">Deactivate</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button variant="contained" onClick={() => handleOpenLoanDialog()}>
              Add New Loan
            </Button>
            <TextField
              label="Search Loans"
              variant="outlined"
              size="small"
              value={loanSearch}
              onChange={(e) => setLoanSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Book</TableCell>
                  <TableCell>Borrow Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan._id}>
                    <TableCell>{loan.user.name} ({loan.user.email})</TableCell>
                    <TableCell>{loan.book.title}</TableCell>
                    <TableCell>{new Date(loan.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(loan.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{loan.status}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenLoanDialog(loan)}>Edit</Button>
                      {loan.status === 'Active' && (
                        <>
                          <Button size="small" onClick={() => handleReturnBook(loan._id)}>Return</Button>
                          <Button size="small" onClick={() => handleExtendLoan(loan._id)}>Extend</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogContent>
          {bookError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bookError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Author"
            fullWidth
            value={bookForm.author}
            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={bookForm.description}
            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            value={bookForm.category}
            onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Year"
            fullWidth
            type="number"
            value={bookForm.year}
            onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
          />
          <TextField
            margin="dense"
            label="ISBN"
            fullWidth
            value={bookForm.isbn}
            onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
          />
          <TextField
            margin="dense"
            label="File URL"
            fullWidth
            value={bookForm.fileUrl}
            onChange={(e) => setBookForm({ ...bookForm, fileUrl: e.target.value })}
          />
          <TextField
            margin="dense"
            label="File Type"
            select
            fullWidth
            value={bookForm.fileType}
            onChange={(e) => setBookForm({ ...bookForm, fileType: e.target.value })}
          >
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="EPUB">EPUB</MenuItem>
            <MenuItem value="Audio">Audio</MenuItem>
            <MenuItem value="Video">Video</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Total Copies"
            fullWidth
            type="number"
            value={bookForm.totalCopies}
            onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
          />
          <TextField
            margin="dense"
            label="Available Copies"
            fullWidth
            type="number"
            value={bookForm.availableCopies}
            onChange={(e) => setBookForm({ ...bookForm, availableCopies: parseInt(e.target.value) || 1 })}
          />
          <TextField
            margin="dense"
            label="Price"
            fullWidth
            type="number"
            value={bookForm.price}
            onChange={(e) => setBookForm({ ...bookForm, price: parseFloat(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveBook}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={loanDialogOpen} onClose={handleCloseLoanDialog}>
        <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
        <DialogContent>
          {!editingLoan && (
            <>
              <Autocomplete
                options={users}
                getOptionLabel={(user) => `${user.name} (${user.email})`}
                value={users.find(user => user._id === loanForm.userId) || null}
                onChange={(event, newValue) => {
                  setLoanForm({ ...loanForm, userId: newValue ? newValue._id : '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    margin="dense"
                    label="Search User"
                    fullWidth
                  />
                )}
              />
              <Autocomplete
                options={books}
                getOptionLabel={(book) => `${book.title} by ${book.author}`}
                value={books.find(book => book._id === loanForm.bookId) || null}
                onChange={(event, newValue) => {
                  setLoanForm({ ...loanForm, bookId: newValue ? newValue._id : '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Search Book"
                    fullWidth
                  />
                )}
              />
            </>
          )}
          <TextField
            autoFocus={editingLoan}
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            value={loanForm.dueDate}
            onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="Status"
            select
            fullWidth
            value={loanForm.status}
            onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value })}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Returned">Returned</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoanDialog}>Cancel</Button>
          <Button onClick={handleSaveLoan}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          {userError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {userError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Role"
            select
            fullWidth
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Librarian">Librarian</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
