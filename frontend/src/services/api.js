import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

export const booksAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  addBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export const loansAPI = {
  getMyLoans: () => api.get('/loans/my-loans'),
  borrowBook: (bookId) => api.post('/loans/borrow', { bookId }),
  returnBook: (loanId) => api.post(`/loans/return/${loanId}`),
  getAllLoans: () => api.get('/loans'),
  createLoan: (loanData) => api.post('/loans', loanData),
  updateLoan: (loanId, loanData) => api.put(`/loans/${loanId}`, loanData),
  extendLoan: (loanId) => api.put(`/loans/extend/${loanId}`),
};

export const reservationsAPI = {
  getMyReservations: () => api.get('/reservations/my-reservations'),
  reserveBook: (bookId) => api.post('/reservations', { bookId }),
  cancelReservation: (reservationId) => api.delete(`/reservations/${reservationId}`),
  getAllReservations: () => api.get('/reservations'),
  fulfillReservation: (reservationId) => api.put(`/reservations/fulfill/${reservationId}`),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getLoansReport: (params) => api.get('/reports/loans', { params }),
  getUsersReport: () => api.get('/reports/users'),
  exportReport: (type) => api.get(`/reports/export/${type}`, { responseType: 'blob' }),
};

export default api;
