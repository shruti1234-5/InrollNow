import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/download.png';
import axios from 'axios';
import {
  Button,
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Header from '../components/Header';

const ReceiptPage = () => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [receiptType, setReceiptType] = useState('registration');

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        const phone = location.state?.phone;
        const type = location.state?.type || 'registration';
        setReceiptType(type);

        if (!phone) {
          navigate('/dashboard');
          return;
        }

        const endpoint = type === 'seat' ? `/payment/seat-receipt/${phone}` : `/payment/receipt/${phone}`;
        const response = await axios.get(endpoint);
        setReceiptData(response.data);
      } catch (error) {
        console.error('Error fetching receipt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [location, navigate, receiptType]);

  const handleDownload = async () => {
    try {
      const phone = location.state?.phone;
      const type = location.state?.type || 'registration';

      if (!phone) {
        console.error('Phone number not found in location state');
        return;
      }

      const downloadEndpoint = type === 'seat' ? `/payment/seat-receipt/${phone}/download` : `/payment/receipt/${phone}/download`;
      const response = await axios.get(downloadEndpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${receiptType}-payment-receipt-${receiptData?.payment?.payment_id}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };  

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Header />
        <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Header />
        <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
          <Typography>No receipt data found</Typography>
        </Container>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <Container maxWidth="md" className="flex-grow-1 py-4">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, position: 'relative' }}>
          {/* Logo and Title in same row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: { xs: 'center', md: 'space-between' },
              alignItems: { xs: 'center', md: 'center' },
              mb: 0.5,
              gap: 0,
            }}
          >
            <img src={logo} alt="Logo" style={{ height: 80 }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                fontSize: '2.8rem',
                flexGrow: { xs: 0, md: 1 },
                textAlign: { xs: 'center', md: 'center' },
                mt: { xs: 0, md: 0 },
                color: '#003366',
              }}
            >
              {receiptType === 'seat' ? 'Seat Lock Payment Receipt' : 'Payment Receipt'}
            </Typography>
          </Box>

          {/* Payment Details */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                <Typography>
                  <strong>Payment ID:</strong> {receiptData.payment?.payment_id}
                </Typography>
                <Typography>
                  <strong>Amount:</strong> Rs. {receiptData.payment?.amount}
                </Typography>
                <Typography>
                  <strong>Date:</strong>{' '}
                  {receiptData.payment?.date && !isNaN(receiptData.payment?.date) ? new Date(receiptData.payment.date).toLocaleString() : 'Invalid Date'}
                </Typography>
                <Typography>
                  <strong>Status:</strong> {receiptData.payment?.status}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Applicant Details
                </Typography>
                <Typography>
                  <strong>Name:</strong> {receiptData.name}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {receiptData.email}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {receiptData.phone}
                </Typography>
                <Typography>
                  <strong>Course:</strong> {receiptData.course}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Download Button in Bottom-Right Corner */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download Receipt
            </Button>
          </Box>
        </Paper>
      </Container>

      <footer className="bg-light text-center py-3 small text-muted border-top mt-auto">
        © {new Date().getFullYear()} LBSIMDS. All rights reserved.
      </footer>
    </div>
  );
};

export default ReceiptPage;
