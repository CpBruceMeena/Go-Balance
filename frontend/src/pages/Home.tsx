import React from 'react';
import { Container, Typography, Paper, Box, Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
    background: 'linear-gradient(135deg, #212f45 0%, #272640 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
}));

const FeatureItem = styled(Typography)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    fontSize: '1.15rem',
    color: '#fff',
    '& svg': {
        marginRight: theme.spacing(1.5),
        color: theme.palette.primary.light,
    },
}));

const Footer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(8),
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: '1rem',
    opacity: 0.7,
}));

const Home = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)' }}>
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box sx={{ mt: 10, mb: 8, textAlign: 'center' }}>
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        gutterBottom 
                        color="primary"
                        sx={{
                            textShadow: '0 0 20px rgba(0, 100, 102, 0.3)',
                            letterSpacing: '0.05em',
                            fontWeight: 800,
                        }}
                    >
                        Go-Balance
                    </Typography>
                    <Typography 
                        variant="h5" 
                        component="h2" 
                        gutterBottom 
                        color="text.secondary"
                        sx={{
                            letterSpacing: '0.05em',
                            fontWeight: 400,
                        }}
                    >
                        A modern, scalable load balancer with a beautiful web interface.
                    </Typography>
                    <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}
                    >
                        Effortlessly manage clusters, monitor health, and optimize traffic with real-time metrics and intuitive controls. Built for reliability, security, and ease of use.
                    </Typography>
                    <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center', gap: 3 }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #006466 30%, #065a60 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #065a60 30%, #0b525b 90%)',
                                },
                            }}
                            onClick={() => navigate('/clusters')}
                        >
                            Get Started
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            size="large"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                borderColor: 'rgba(0, 100, 102, 0.5)',
                                '&:hover': {
                                    borderColor: '#006466',
                                    backgroundColor: 'rgba(0, 100, 102, 0.1)',
                                },
                            }}
                            onClick={() => navigate('/clusters')}
                        >
                            View Clusters
                        </Button>
                    </Box>
                </Box>

                {/* Features Section */}
                <StyledPaper elevation={3}>
                    <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom 
                        color="primary"
                        sx={{
                            textShadow: '0 0 10px rgba(0, 100, 102, 0.2)',
                            mb: 4,
                            fontWeight: 700,
                        }}
                    >
                        Features
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><CloudQueueIcon />Multiple load balancing algorithms</FeatureItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><GroupWorkIcon />Cluster management with isolated configs</FeatureItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><SpeedIcon />Rate limiting & performance rules</FeatureItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><HealthAndSafetyIcon />Health checks & automatic failover</FeatureItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><SecurityIcon />SSL/TLS termination</FeatureItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FeatureItem variant="body1"><TimelineIcon />Real-time monitoring & metrics</FeatureItem>
                        </Grid>
                    </Grid>
                </StyledPaper>

                <Footer>
                    &copy; {new Date().getFullYear()} Go-Balance &mdash; Modern Load Balancer
                </Footer>
            </Container>
        </Box>
    );
};

export default Home; 