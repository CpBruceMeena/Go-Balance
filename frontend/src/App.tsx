import type React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { colors } from './theme/colors';
import ClusterManagement from './components/ClusterManagement';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ backgroundColor: colors.primary }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Go-Balance
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                Home
              </Link>
              <Link to="/clusters" style={{ color: 'white', textDecoration: 'none' }}>
                Clusters
              </Link>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clusters" element={<ClusterManagement />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
};

export default App; 