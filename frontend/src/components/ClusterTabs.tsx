import React from 'react';
import { Tabs, Tab, Box, Typography, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, Stack, useMediaQuery, useTheme, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SettingsIcon from '@mui/icons-material/Settings';
import type { Cluster, Node } from '../services/clusterService';
import LiveMonitoringPanel from './LiveMonitoringPanel';

const INTERVAL_OPTIONS = [
  { label: '5m', value: '5m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '3h', value: '3h' },
  { label: '24h', value: '24h' },
  { label: '2d', value: '2d' },
  { label: '7d', value: '7d' },
];

interface ClusterTabsProps {
  cluster: Cluster;
  nodes: Node[];
  nodesMetrics: any[];
  autoRefresh: boolean;
  refreshInterval: number;
  onToggleAutoRefresh: () => void;
  onChangeInterval: (interval: number) => void;
}

const ClusterTabs: React.FC<ClusterTabsProps> = ({ cluster, nodes, nodesMetrics, autoRefresh, refreshInterval, onToggleAutoRefresh, onChangeInterval }) => {
  const [tab, setTab] = React.useState(0);
  const [monitoringInterval, setMonitoringInterval] = React.useState('1h');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handler for edit cluster (placeholder, can be replaced with actual logic)
  const handleEditCluster = () => {
    // You can trigger a dialog or callback here
    alert('Edit Cluster clicked!');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Cluster Details" />
          <Tab label="Monitoring" />
        </Tabs>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={handleEditCluster}
          sx={{ ml: 2, fontWeight: 600, borderRadius: 2 }}
        >
          Edit Cluster
        </Button>
      </Box>
      <Box sx={{ p: 2, background: '#f9f6f2', borderRadius: 2, minHeight: 120 }}>
        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Cluster Info</Typography>
            <Typography><b>Name:</b> {cluster.name}</Typography>
            <Typography><b>Algorithm:</b> {cluster.algorithm}</Typography>
            <Typography><b>Health Check Endpoint:</b> {cluster.healthCheckEndpoint}</Typography>
            <Typography><b>Health Check Frequency:</b> {cluster.healthCheckFrequency} seconds</Typography>
            <Typography><b>Created At:</b> {cluster.createdAt ? new Date(cluster.createdAt).toLocaleString() : 'N/A'}</Typography>
            <Typography><b>Nodes:</b> {nodes.length}</Typography>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            {/* Controls Toolbar */}
            <Stack
              direction={isMobile ? 'column' : 'row'}
              spacing={2}
              alignItems={isMobile ? 'stretch' : 'center'}
              justifyContent="space-between"
              sx={{
                background: '#f5ede6',
                borderRadius: 2,
                px: 2,
                py: 1,
                mb: 2,
                flexWrap: 'wrap',
                boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ mr: 1, color: 'var(--text-secondary)' }}>Time Range:</Typography>
                <ToggleButtonGroup
                  value={monitoringInterval}
                  exclusive
                  onChange={(_, val) => val && setMonitoringInterval(val)}
                  size="small"
                  sx={{
                    background: '#fff',
                    borderRadius: 2,
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
                    '& .Mui-selected': {
                      background: '#e6cfa7',
                      color: '#222',
                      fontWeight: 700,
                    },
                  }}
                >
                  {INTERVAL_OPTIONS.map(opt => (
                    <ToggleButton value={opt.value} key={opt.value} sx={{ px: 2 }}>
                      {opt.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: isMobile ? 1 : 0 }}>
                <Tooltip title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}>
                  <IconButton onClick={onToggleAutoRefresh} color={autoRefresh ? 'primary' : 'default'}>
                    {autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <LiveMonitoringPanel
              nodes={nodesMetrics}
              autoRefresh={autoRefresh}
              refreshInterval={refreshInterval}
              onToggleAutoRefresh={onToggleAutoRefresh}
              onChangeInterval={onChangeInterval}
              interval={monitoringInterval}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ClusterTabs; 