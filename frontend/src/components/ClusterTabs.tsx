import React from 'react';
import { Tabs, Tab, Box, Typography, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, Stack, useMediaQuery, useTheme, Divider, TextField, InputAdornment, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SettingsIcon from '@mui/icons-material/Settings';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { Cluster, Node } from '../services/clusterService';
import LiveMonitoringPanel from './LiveMonitoringPanel';
import { MenuItem } from '@mui/material';

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

  // Security state (mocked for now)
  const [rateLimit, setRateLimit] = React.useState({ rps: 100, rpm: 5000, rph: 100000 });
  const [ipWhitelist, setIpWhitelist] = React.useState('');
  const [ipBlacklist, setIpBlacklist] = React.useState('');
  const [authEnabled, setAuthEnabled] = React.useState(false);
  const [authType, setAuthType] = React.useState<'basic' | 'oauth'>('basic');
  const [authUser, setAuthUser] = React.useState('');
  const [authPass, setAuthPass] = React.useState('');
  const [savingSecurity, setSavingSecurity] = React.useState(false);
  const [securitySaved, setSecuritySaved] = React.useState(false);

  // API & Automation state (mocked for now)
  const [apiToken, setApiToken] = React.useState('');
  const [tokenCopied, setTokenCopied] = React.useState(false);

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

  const handleSaveSecurity = () => {
    setSavingSecurity(true);
    setTimeout(() => {
      setSavingSecurity(false);
      setSecuritySaved(true);
      setTimeout(() => setSecuritySaved(false), 2000);
    }, 1000);
  };

  const handleGenerateToken = () => {
    setApiToken('mocked-token-' + Math.random().toString(36).slice(2));
    setTokenCopied(false);
  };
  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 1500);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Cluster Details" />
          <Tab label="Monitoring" />
          <Tab label="Alerts" />
          <Tab label="SSL/TLS" />
          <Tab label="Security" />
          <Tab label="API & Automation" />
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
        {tab === 4 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Security Settings</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
              Configure rate limiting, IP access control, and authentication for this cluster.
            </Typography>
            <Stack spacing={3} direction="column" sx={{ maxWidth: 600 }}>
              {/* Rate Limiting */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Rate Limiting</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Requests/sec"
                    type="number"
                    value={rateLimit.rps}
                    onChange={e => setRateLimit({ ...rateLimit, rps: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="Requests/min"
                    type="number"
                    value={rateLimit.rpm}
                    onChange={e => setRateLimit({ ...rateLimit, rpm: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="Requests/hour"
                    type="number"
                    value={rateLimit.rph}
                    onChange={e => setRateLimit({ ...rateLimit, rph: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Stack>
              </Box>
              {/* IP Whitelist/Blacklist */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>IP Access Control</Typography>
                <TextField
                  label="IP Whitelist (comma-separated)"
                  fullWidth
                  value={ipWhitelist}
                  onChange={e => setIpWhitelist(e.target.value)}
                  placeholder="192.168.1.1, 10.0.0.0/8"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="IP Blacklist (comma-separated)"
                  fullWidth
                  value={ipBlacklist}
                  onChange={e => setIpBlacklist(e.target.value)}
                  placeholder="203.0.113.0, 172.16.0.0/12"
                />
              </Box>
              {/* Authentication */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Authentication</Typography>
                <FormControlLabel
                  control={<Switch checked={authEnabled} onChange={e => setAuthEnabled(e.target.checked)} />}
                  label="Enable Authentication"
                  sx={{ mb: 1 }}
                />
                {authEnabled && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      select
                      label="Auth Type"
                      value={authType}
                      onChange={e => setAuthType(e.target.value as 'basic' | 'oauth')}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="basic">Basic Auth</MenuItem>
                      <MenuItem value="oauth">OAuth</MenuItem>
                    </TextField>
                    {authType === 'basic' && (
                      <>
                        <TextField
                          label="Username"
                          value={authUser}
                          onChange={e => setAuthUser(e.target.value)}
                        />
                        <TextField
                          label="Password"
                          type="password"
                          value={authPass}
                          onChange={e => setAuthPass(e.target.value)}
                        />
                      </>
                    )}
                    {authType === 'oauth' && (
                      <TextField
                        label="OAuth Config (JSON)"
                        value={authUser}
                        onChange={e => setAuthUser(e.target.value)}
                        placeholder="{ clientId, clientSecret, ... }"
                        fullWidth
                      />
                    )}
                  </Stack>
                )}
              </Box>
              <Button
                variant="contained"
                sx={{ mt: 2, fontWeight: 600, borderRadius: 2 }}
                onClick={handleSaveSecurity}
                disabled={savingSecurity}
              >
                {savingSecurity ? 'Saving...' : 'Save Security Settings'}
              </Button>
              {securitySaved && (
                <Typography color="success.main" sx={{ mt: 2 }}>
                  Security settings saved!
                </Typography>
              )}
            </Stack>
          </Box>
        )}
        {tab === 5 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>API & Automation</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
              Use the REST API or CLI to automate cluster and node management. Example endpoints and requests are shown below.
            </Typography>
            <Box sx={{ mb: 3, p: 2, background: '#f9f6f2', borderRadius: 2 }}>
              <Typography variant="subtitle2">API Token</Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <TextField
                  label="API Token"
                  value={apiToken}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleCopyToken} disabled={!apiToken} aria-label="Copy token">
                        <ContentCopyIcon />
                      </IconButton>
                    )
                  }}
                  sx={{ minWidth: 320 }}
                  disabled
                />
                <Button variant="outlined" onClick={handleGenerateToken}>Generate Token</Button>
                {tokenCopied && <Typography color="success.main">Copied!</Typography>}
              </Stack>
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Example API Endpoints</Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: 15, background: '#f4f4f4', borderRadius: 1, p: 2, mb: 2 }}>
              GET /api/clusters<br />
              POST /api/clusters<br />
              GET /api/clusters/:clusterId<br />
              PUT /api/clusters/:clusterId<br />
              DELETE /api/clusters/:clusterId<br />
              POST /api/clusters/:clusterId/nodes<br />
              DELETE /api/clusters/:clusterId/nodes/:nodeId<br />
              GET /api/clusters/:clusterId/nodes/metrics<br />
            </Box>
            <Typography variant="subtitle2">Example curl Request</Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: 15, background: '#f4f4f4', borderRadius: 1, p: 2, mb: 2 }}>
              curl -H "Authorization: Bearer &lt;API_TOKEN&gt;" \
              http://localhost:8080/api/clusters
            </Box>
            <Typography variant="subtitle2">CLI & Terraform</Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: 15, background: '#f4f4f4', borderRadius: 1, p: 2 }}>
              # CLI (coming soon)
              go-balance-cli create-cluster --name my-cluster
              <br /><br />
              # Terraform (coming soon)
              {`resource "go_balance_cluster" "example" {
                name = "my-cluster"
              }`}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ClusterTabs; 