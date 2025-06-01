import React from 'react';
import { AppBar, Toolbar, Typography, Box, Breadcrumbs, Link, Avatar, IconButton, Badge, Menu, MenuItem, Tooltip, Autocomplete, TextField } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';

const clusters = [
  { label: 'ICICI', id: 'icici' },
  { label: 'HDFC', id: 'hdfc' },
  { label: 'SBI', id: 'sbi' },
]; // TODO: Replace with real cluster list

const Header: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Breadcrumbs logic
  const pathnames = location.pathname.split('/').filter(x => x);
  const breadcrumbs = [
    <Link underline="hover" key="home" color="inherit" onClick={() => navigate('/')}
      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
    </Link>,
    ...pathnames.map((value, idx) => {
      const to = '/' + pathnames.slice(0, idx + 1).join('/');
      return (
        <Link
          underline="hover"
          key={to}
          color={idx === pathnames.length - 1 ? 'text.primary' : 'inherit'}
          onClick={() => navigate(to)}
          sx={{ cursor: 'pointer' }}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Link>
      );
    })
  ];

  // User menu
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Search
  const handleSearch = (event: any, value: any) => {
    if (value && value.id) {
      navigate(`/clusters/${value.id}`);
    }
  };

  return (
    <AppBar position="static" color="default" elevation={2} sx={{ background: 'linear-gradient(90deg, #1976d2 60%, #90caf9 100%)' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Logo/Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <img src="/logo192.png" alt="Go-Balance Logo" style={{ width: 36, height: 36, marginRight: 8 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, color: '#fff' }}>
            Go-Balance
          </Typography>
        </Box>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1, color: '#fff' }}>
          {breadcrumbs}
        </Breadcrumbs>
        {/* Cluster Search */}
        <Autocomplete
          options={clusters}
          getOptionLabel={option => option.label}
          sx={{ width: 220, background: '#fff', borderRadius: 1, mr: 2 }}
          size="small"
          onChange={handleSearch}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search Clusters" variant="outlined" size="small"
              InputProps={{ ...params.InputProps, startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
            />
          )}
        />
        {/* Notification Bell */}
        <Tooltip title="Notifications">
          <IconButton size="large" color="inherit" sx={{ color: '#fff' }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        {/* User Profile Dropdown */}
        <Box>
          <IconButton size="large" onClick={handleMenu} sx={{ color: '#fff' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 