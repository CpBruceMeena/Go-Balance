import type React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Home from './pages/Home';
import ClusterRoutes from './routes/ClusterRoutes';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
          <ClusterRoutes />
        </Container>
      </Box>
    </Router>
  );
};

export default App; 