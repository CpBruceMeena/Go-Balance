import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

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
    '&::before': {
        content: '"•"',
        color: theme.palette.primary.main,
        fontWeight: 'bold',
        marginRight: theme.spacing(1),
    },
}));

const Home = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 8, mb: 6 }}>
                <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    align="center" 
                    color="primary"
                    sx={{
                        textShadow: '0 0 20px rgba(0, 100, 102, 0.3)',
                        letterSpacing: '0.05em',
                    }}
                >
                    Go-Balance
                </Typography>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom 
                    align="center" 
                    color="text.secondary"
                    sx={{
                        letterSpacing: '0.05em',
                    }}
                >
                    Modern Load Balancer with Web Interface
                </Typography>
            </Box>

            <StyledPaper elevation={3}>
                <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom 
                    color="primary"
                    sx={{
                        textShadow: '0 0 10px rgba(0, 100, 102, 0.2)',
                        mb: 4,
                    }}
                >
                    Features
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <FeatureItem variant="body1">
                        Multiple load balancing algorithms (Round Robin, Least Connections, Weighted Round Robin, IP Hash)
                    </FeatureItem>
                    <FeatureItem variant="body1">
                        Cluster management with isolated configurations
                    </FeatureItem>
                    <FeatureItem variant="body1">
                        Rate limiting with customizable rules
                    </FeatureItem>
                    <FeatureItem variant="body1">
                        Health checks and automatic failover
                    </FeatureItem>
                    <FeatureItem variant="body1">
                        SSL/TLS termination
                    </FeatureItem>
                    <FeatureItem variant="body1">
                        Real-time monitoring and metrics
                    </FeatureItem>
                </Box>
            </StyledPaper>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    sx={{
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(45deg, #006466 30%, #065a60 90%)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #065a60 30%, #0b525b 90%)',
                        },
                    }}
                >
                    Create Cluster
                </Button>
                <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large"
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderColor: 'rgba(0, 100, 102, 0.5)',
                        '&:hover': {
                            borderColor: '#006466',
                            backgroundColor: 'rgba(0, 100, 102, 0.1)',
                        },
                    }}
                >
                    View Clusters
                </Button>
            </Box>
        </Container>
    );
};

export default Home; 