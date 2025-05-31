import React from 'react';
import { Tabs, Tab, Box, Typography, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, Stack, useMediaQuery, useTheme, Divider, TextField, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SettingsIcon from '@mui/icons-material/Settings';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
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

  // Alert thresholds state (mocked for now)
  const [alertThresholds, setAlertThresholds] = React.useState({
    cpu: 80,
    memory: 80,
    responseTime: 200,
    errorRate: 5,
  });
  const [savingAlerts, setSavingAlerts] = React.useState(false);
  const [alertSaved, setAlertSaved] = React.useState(false);

  // SSL/TLS state (mocked for now)
  const [cert, setCert] = React.useState('');
  const [key, setKey] = React.useState('');
  const [certStatus, setCertStatus] = React.useState<'none' | 'valid' | 'expiring' | 'invalid'>('none');
  const [certMessage, setCertMessage] = React.useState('No certificate uploaded.');
  const [uploading, setUploading] = React.useState(false);

  // Handler for edit cluster (placeholder, can be replaced with actual logic)
  const handleEditCluster = () => {
    // You can trigger a dialog or callback here
    alert('Edit Cluster clicked!');
  };

  const handleAlertChange = (field: string, value: number) => {
    setAlertThresholds((prev) => ({ ...prev, [field]: value }));
  };
  const handleSaveAlerts = () => {
    setSavingAlerts(true);
    setTimeout(() => {
      setSavingAlerts(false);
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 2000);
    }, 1000);
  };

  const handleCertUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setCertStatus('valid');
      setCertMessage('Certificate is valid. Expires: 2025-12-31');
      setUploading(false);
    }, 1200);
  };
  const handleRemoveCert = () => {
    setCert('');
    setKey('');
    setCertStatus('none');
    setCertMessage('No certificate uploaded.');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Cluster Details" />
          <Tab label="Monitoring" />
          <Tab label="Alerts" />
          <Tab label="SSL/TLS" />
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
        {tab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Alert Configuration</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
              Set thresholds for key metrics. You'll be alerted if any metric exceeds its threshold.
            </Typography>
            <Stack spacing={2} direction={isMobile ? 'column' : 'row'}>
              <TextField
                label="CPU Usage (%)"
                type="number"
                value={alertThresholds.cpu}
                onChange={e => handleAlertChange('cpu', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                helperText="Alert if CPU usage exceeds this value"
              />
              <TextField
                label="Memory Usage (%)"
                type="number"
                value={alertThresholds.memory}
                onChange={e => handleAlertChange('memory', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                helperText="Alert if memory usage exceeds this value"
              />
              <TextField
                label="Response Time (ms)"
                type="number"
                value={alertThresholds.responseTime}
                onChange={e => handleAlertChange('responseTime', Number(e.target.value))}
                inputProps={{ min: 1, max: 10000 }}
                helperText="Alert if avg response time exceeds this value"
              />
              <TextField
                label="Error Rate (%)"
                type="number"
                value={alertThresholds.errorRate}
                onChange={e => handleAlertChange('errorRate', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                helperText="Alert if error rate exceeds this value"
              />
            </Stack>
            <Button
              variant="contained"
              sx={{ mt: 3, fontWeight: 600, borderRadius: 2 }}
              onClick={handleSaveAlerts}
              disabled={savingAlerts}
            >
              {savingAlerts ? 'Saving...' : 'Save Thresholds'}
            </Button>
            {alertSaved && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                Alert thresholds saved!
              </Typography>
            )}
          </Box>
        )}
        {tab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>SSL/TLS Certificate Management</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
              Upload or paste a certificate and private key to enable SSL termination for this cluster.
            </Typography>
            <Stack spacing={2} direction="column" sx={{ maxWidth: 600 }}>
              <TextField
                label="Certificate (PEM)"
                multiline
                minRows={4}
                value={cert}
                onChange={e => setCert(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton component="label" aria-label="Upload certificate file">
                        <FileUploadIcon />
                        <input
                          type="file"
                          accept=".pem,.crt,.cer"
                          hidden
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setCert(ev.target?.result as string);
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                label="Private Key (PEM)"
                multiline
                minRows={4}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton component="label" aria-label="Upload private key file">
                        <FileUploadIcon />
                        <input
                          type="file"
                          accept=".pem,.key"
                          hidden
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setKey(ev.target?.result as string);
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCertUpload}
                  disabled={!cert || !key || uploading}
                  startIcon={<FileUploadIcon />}
                >
                  {uploading ? 'Uploading...' : 'Upload Certificate'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveCert}
                  disabled={certStatus === 'none'}
                  startIcon={<DeleteIcon />}
                >
                  Remove Certificate
                </Button>
              </Stack>
              <Box sx={{ mt: 2, p: 2, background: certStatus === 'valid' ? '#e6f4ea' : certStatus === 'expiring' ? '#fffbe6' : '#fbeaea', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: certStatus === 'valid' ? 'green' : certStatus === 'expiring' ? '#b48a5a' : 'red' }}>
                  {certMessage}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ClusterTabs; 