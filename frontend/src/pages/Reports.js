import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import api from '../services/api';

const Reports = () => {
  const [stats, setStats] = useState({});
  const [popularBooks, setPopularBooks] = useState([]);
  const [userActivity, setUserActivity] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [statsResponse, popularResponse, activityResponse] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports/popular-books'),
        api.get('/reports/user-activity')
      ]);
      setStats(statsResponse.data);
      setPopularBooks(popularResponse.data);
      setUserActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleExportCSV = async (type) => {
    try {
      const response = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/reports/export/active-loans/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const time=Date.now();
      link.setAttribute('download', `active_loans_report_${time}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Books</Typography>
              <Typography variant="h4">{stats.totalBooks || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active Loans</Typography>
              <Typography variant="h4">{stats.activeLoans || 0}</Typography>
              <Button variant="outlined" size="small" onClick={() => handleExportPDF()} sx={{ mt: 1 }}>
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h4">{stats.totalUsers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Most Popular Books
        </Typography>
        <Button variant="outlined" onClick={() => handleExportCSV('popular-books')} sx={{ mb: 2 }}>
          Export CSV
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Times Borrowed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {popularBooks.map((book, index) => (
                <TableRow key={index}>
                  <TableCell>{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.borrowCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          User Activity
        </Typography>
        <Button variant="outlined" onClick={() => handleExportCSV('user-activity')} sx={{ mb: 2 }}>
          Export CSV
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Books Borrowed</TableCell>
                <TableCell>Current Loans</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userActivity.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.totalBorrowed}</TableCell>
                  <TableCell>{user.currentLoans}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Reports;
