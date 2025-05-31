import { useState, useEffect, useCallback } from 'react';
import { clusterService, type Cluster, type CreateClusterRequest, type NodeMetric } from '../services/clusterService';
import { colors } from '../theme/colors';
import { 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Typography, 
  Grid,
  Box,
  Card,
  CardContent,
  Chip,
  Tooltip,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import SettingsIcon from '@mui/icons-material/Settings';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LiveMonitoringPanel from './LiveMonitoringPanel';
import { useNavigate } from 'react-router-dom';
import styles from './ClusterManagement.module.css';
import ClusterTabs from './ClusterTabs';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

// 1. Main background
const mainBackground = 'var(--linen)';
// 2. Cluster card background and border
const cardBackground = 'var(--isabelline)';
const cardBorder = '1px solid var(--timberwolf)';
const cardShadow = 'var(--shadow)';
const cardRadius = 12;
// 3. Primary text
const textPrimary = 'var(--text-primary)';
// 4. Secondary text
const textSecondary = 'var(--text-secondary)';
const textTertiary = 'var(--text-tertiary)';
// 5. Status indicators
const healthyStatus = { background: 'var(--success-bg)', color: '#fff', padding: '4px 12px', borderRadius: 16 };
const errorStatus = { background: 'var(--error-bg)', color: '#fff', padding: '4px 12px', borderRadius: 16 };
// 6. Buttons
const primaryButton = { background: 'var(--champagne-pink)', color: textPrimary, fontWeight: 600, borderRadius: 3, px: 5, py: 1.7, boxShadow: 'var(--shadow)', textTransform: 'none', fontSize: '1.1rem', '&:hover': { background: '#d1a97e' } };
const secondaryButton = { background: 'var(--timberwolf)', color: textPrimary, '&:hover': { background: '#bfb8b0' } };
// 7. Error messages
const errorMessage = { color: 'var(--error-bg)', background: 'var(--error-light)', padding: 12, borderRadius: 8 };
// 8. Input fields
const inputField = { background: '#fff', border: '1px solid var(--timberwolf)', color: textPrimary };
const inputFocus = { border: '2px solid var(--champagne-pink)' };
// 9. Action icons
const deleteIcon = { color: 'var(--error-bg)', minWidth: 40, minHeight: 40 };
const refreshIcon = { color: textSecondary, minWidth: 40, minHeight: 40 };
const copyIcon = { color: textSecondary, minWidth: 40, minHeight: 40 };
// 10. Navigation header
const navHeader = { background: '#fff', color: textPrimary, borderBottom: '1px solid var(--timberwolf)' };

const ClusterManagement = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [openClusterDialog, setOpenClusterDialog] = useState(false);
  const [openNodeDialog, setOpenNodeDialog] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [newCluster, setNewCluster] = useState<CreateClusterRequest>({
    name: '',
    algorithm: 'round-robin',
    healthCheckEndpoint: '',
    healthCheckFrequency: 30 // Default to 30 seconds
  });
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [newNodeWeight, setNewNodeWeight] = useState(1);
  const [error, setError] = useState<string>('');
  const [editingCluster, setEditingCluster] = useState<string | null>(null);
  const [editHealthCheckEndpoint, setEditHealthCheckEndpoint] = useState('');
  const [editHealthCheckFrequency, setEditHealthCheckFrequency] = useState(0);
  const [success, setSuccess] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<{[key: string]: boolean}>({});
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric[]>([]);
  const [monitoringClusterId, setMonitoringClusterId] = useState<string | null>(null);
  const [checkingNodeId, setCheckingNodeId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const fetchClusters = useCallback(async () => {
    try {
      const data = await clusterService.getClusters();
      setClusters(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch clusters');
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    fetchClusters();
    const interval = setInterval(fetchClusters, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchClusters, autoRefresh, refreshInterval]);

  // Fetch node metrics for the selected cluster
  useEffect(() => {
    if (!monitoringClusterId) {
      if (clusters.length > 0) setMonitoringClusterId(clusters[0].id);
      return;
    }
    if (!autoRefresh) return;
    let cancelled = false;
    const fetchMetrics = async () => {
      try {
        const metrics = await clusterService.getNodeMetrics(monitoringClusterId);
        if (!cancelled) setNodeMetrics(metrics);
      } catch (err) {
        if (!cancelled) setNodeMetrics([]);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => { cancelled = true; clearInterval(interval); };
  }, [monitoringClusterId, clusters, autoRefresh, refreshInterval]);

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      await clusterService.createCluster(newCluster);
      setNewCluster({
        name: '',
        algorithm: 'round-robin',
        healthCheckEndpoint: '',
        healthCheckFrequency: 30
      });
      await fetchClusters();
      setOpenClusterDialog(false);
      setSnackbar({ open: true, message: 'Cluster created successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create cluster', severity: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddNode = async (clusterId: string) => {
    setIsAddingNode(true);
    setError('');
    try {
      await clusterService.addNode(clusterId, newNodeUrl, newNodeWeight);
      setNewNodeUrl('');
      setNewNodeWeight(1);
      await fetchClusters();
      setOpenNodeDialog(false);
      setSnackbar({ open: true, message: 'Node added successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add node', severity: 'error' });
    } finally {
      setIsAddingNode(false);
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    try {
      await clusterService.deleteCluster(clusterId);
      fetchClusters();
      setError('');
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete cluster', severity: 'error' });
    }
  };

  const handleDeleteNode = async (clusterId: string, nodeId: string) => {
    try {
      await clusterService.deleteNode(clusterId, nodeId);
      setClusters(clusters.map(cluster =>
        cluster.id === clusterId
          ? { ...cluster, nodes: cluster.nodes.filter(node => node.id !== nodeId) }
          : cluster
      ));
      setError('');
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete node', severity: 'error' });
      console.error('Error deleting node:', err);
    }
  };

  const handleCheckHealth = async (clusterId: string, nodeId: string) => {
    setCheckingNodeId(nodeId);
    try {
      const updatedNode = await clusterService.checkNodeHealth(clusterId, nodeId);
      setClusters(clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              nodes: cluster.nodes.map(node =>
                node.id === nodeId ? updatedNode : node
              ),
            }
          : cluster
      ));
      setError('');
      setSnackbar({ open: true, message: 'Health check complete', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to check node health', severity: 'error' });
      console.error('Error checking node health:', err);
    } finally {
      setCheckingNodeId(null);
    }
  };

  const handleHealthCheckFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Number.parseInt(e.target.value, 10));
    setNewCluster({ ...newCluster, healthCheckFrequency: value });
  };

  const handleEditCluster = (cluster: Cluster) => {
    setEditingCluster(cluster.id);
    setEditHealthCheckEndpoint(cluster.healthCheckEndpoint);
    setEditHealthCheckFrequency(cluster.healthCheckFrequency);
  };

  const handleSaveCluster = async (clusterId: string) => {
    try {
      const updatedCluster = await clusterService.updateCluster(clusterId, {
        healthCheckEndpoint: editHealthCheckEndpoint,
        healthCheckFrequency: editHealthCheckFrequency
      });
      setClusters(clusters.map(cluster =>
        cluster.id === clusterId ? updatedCluster : cluster
      ));
      setEditingCluster(null);
      setSnackbar({ open: true, message: 'Cluster updated successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update cluster', severity: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditingCluster(null);
  };

  function getClusterHealthStatus(cluster: { nodes: { healthStatus: string }[] }): 'healthy' | 'unhealthy' | 'warning' | 'unknown' {
    if (!cluster.nodes || cluster.nodes.length === 0) return 'unknown';
    const healthy = cluster.nodes.filter((n: { healthStatus: string }) => n.healthStatus === 'healthy').length;
    if (healthy === cluster.nodes.length) return 'healthy';
    if (healthy === 0) return 'unhealthy';
    return 'warning';
  }

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };
  const handleExpandRow = (nodeId: string) => {
    setExpandedRows((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.background = 'rgba(232, 196, 160, 0.2)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>, rowBg: string) => {
    e.currentTarget.style.background = rowBg;
  };

  const handleTestAllNodes = async (clusterId: string) => {
    // TODO: Implement backend call to test all nodes
    alert(`Test All Nodes triggered for cluster ${clusterId}`);
  };

  const handleDrainNode = async (clusterId: string, nodeId: string) => {
    // TODO: Implement backend call to drain node
    alert(`Drain Node triggered for node ${nodeId}`);
  };

  const handleBulkDrain = async (clusterId: string) => {
    // TODO: Implement backend call to drain selected nodes
    alert(`Drain Selected Nodes: ${Object.keys(selectedNodes).filter(id => selectedNodes[id]).join(', ')}`);
  };

  const handleBulkDelete = async (clusterId: string) => {
    // TODO: Implement backend call to delete selected nodes
    alert(`Delete Selected Nodes: ${Object.keys(selectedNodes).filter(id => selectedNodes[id]).join(', ')}`);
  };

  if (clusters.length === 0) {
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Card sx={{ background: colors.linen, color: colors.champagnePink, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', p: 3 }}>
            <AddCircleOutlineIcon sx={{ fontSize: 72, color: colors.paleDogwood, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: colors.champagnePink }}>
              No clusters yet
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: colors.paleDogwood }}>
              Get started by creating your first cluster.
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.paleDogwood,
                color: '#333',
                fontWeight: 700,
                borderRadius: 3,
                px: 5,
                py: 1.7,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                textTransform: 'none',
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: colors.champagnePink,
                  color: '#333',
                },
              }}
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setOpenClusterDialog(true)}
            >
              Create Cluster
            </Button>
          </Card>
        </Box>
        <Dialog 
          open={openClusterDialog} 
          onClose={() => setOpenClusterDialog(false)}
          maxWidth={false}
        >
          <DialogTitle sx={{
            color: colors.primary,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '1.25rem',
            pb: 0
          }}>
            Create New Cluster
          </DialogTitle>
          <DialogContent sx={{
            pt: 1,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <form onSubmit={handleCreateCluster} style={{ width: '100%' }}>
              <TextField
                autoFocus
                margin="normal"
                label="Cluster Name"
                fullWidth
                value={newCluster.name}
                onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })}
                required
                inputProps={{ maxLength: 50 }}
                helperText="Enter a name for your cluster (max 50 characters)"
              />
              <TextField
                margin="normal"
                label="Health Check Endpoint"
                fullWidth
                value={newCluster.healthCheckEndpoint}
                onChange={(e) => setNewCluster({ ...newCluster, healthCheckEndpoint: e.target.value })}
                placeholder="/health"
                helperText="Enter the health check endpoint path (e.g., /health)"
                required
                inputProps={{ maxLength: 100 }}
              />
              <TextField
                margin="normal"
                label="Health Check Frequency (seconds)"
                fullWidth
                type="number"
                value={newCluster.healthCheckFrequency}
                onChange={handleHealthCheckFrequencyChange}
                inputProps={{ min: 1, max: 300 }}
                required
                helperText="Enter frequency between 1 and 300 seconds"
              />
              <TextField
                select
                margin="normal"
                label="Load Balancing Algorithm"
                fullWidth
                value={newCluster.algorithm}
                onChange={(e) => setNewCluster({ ...newCluster, algorithm: e.target.value })}
                required
                helperText="Select the load balancing algorithm"
              >
                <MenuItem value="round-robin">Round Robin</MenuItem>
                <MenuItem value="least-connections">Least Connections</MenuItem>
                <MenuItem value="weighted-round-robin">Weighted Round Robin</MenuItem>
                <MenuItem value="ip-hash">IP Hash</MenuItem>
                <MenuItem value="least-response-time">Least Response Time</MenuItem>
              </TextField>
              <Box sx={{ mt: 1, mb: 2, background: '#f9f6f2', borderRadius: 1, p: 1.5, fontSize: 14, color: 'var(--text-secondary)' }}>
                <b>Algorithm Info:</b><br />
                <b>Round Robin:</b> Evenly distributes requests.<br />
                <b>Weighted Round Robin:</b> Distributes based on node weights.<br />
                <b>Least Connections:</b> Chooses node with fewest active connections.<br />
                <b>IP Hash:</b> Routes based on client IP.<br />
                <b>Least Response Time:</b> Chooses node with lowest response time.
              </Box>
            </form>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={() => setOpenClusterDialog(false)} color="secondary" disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCluster} 
              variant="contained" 
              color="primary"
              disabled={isCreating}
              startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isCreating ? 'Creating...' : 'Create Cluster'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, background: mainBackground, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: textPrimary, fontWeight: 700 }}>
          Cluster Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}>
            <IconButton onClick={() => setAutoRefresh((prev) => !prev)}>
              {autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Typography sx={errorMessage}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography sx={{ color: healthyStatus.background, background: '#e6f4ea', padding: 1, borderRadius: 8, mb: 2 }}>
          {success}
        </Typography>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Auto-Refresh Settings</DialogTitle>
        <DialogContent>
          <TextField
            label="Refresh Interval (ms)"
            type="number"
            value={refreshInterval}
            onChange={e => setRefreshInterval(Number(e.target.value))}
            inputProps={{ min: 1000, step: 1000 }}
            fullWidth
            helperText="Set the auto-refresh interval in milliseconds (min 1000)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {clusters.map((cluster) => {
          const clusterHealth = getClusterHealthStatus(cluster);
          const clusterStatusLabel = clusterHealth === 'healthy' ? 'Healthy' : clusterHealth === 'warning' ? 'Warning' : 'Unhealthy';
          const clusterStatusIcon = clusterHealth === 'healthy' ? (
            <Tooltip title="All nodes healthy"><CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18, mr: 1 }} aria-label="Healthy" /></Tooltip>
          ) : clusterHealth === 'warning' ? (
            <Tooltip title="Some nodes unhealthy"><WarningIcon sx={{ color: '#ffb300', fontSize: 18, mr: 1 }} aria-label="Warning" /></Tooltip>
          ) : clusterHealth === 'unhealthy' ? (
            <Tooltip title="All nodes unhealthy"><ErrorIcon sx={{ color: '#f44336', fontSize: 18, mr: 1 }} aria-label="Unhealthy" /></Tooltip>
          ) : (
            <Tooltip title="Unknown cluster health"><ErrorIcon sx={{ color: '#bdbdbd', fontSize: 18, mr: 1 }} aria-label="Unknown" /></Tooltip>
          );

          return (
            <Grid item xs={12} sm={12} md={12} key={cluster.id}>
              <Card elevation={4} sx={{
                background: cardBackground,
                color: textPrimary,
                borderRadius: cardRadius,
                boxShadow: cardShadow,
                p: 4,
                mb: 3,
                transition: 'box-shadow 0.2s, transform 0.2s',
                border: cardBorder,
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px) scale(1.01)' },
                minWidth: '100%',
                maxWidth: '100%',
                width: '100%',
                mx: 'auto',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600, mr: 1 }}>
                      {window.location.origin}{cluster.publicEndpoint}
                    </Typography>
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(window.location.origin + cluster.publicEndpoint)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: clusterHealth === 'healthy' ? '#48BB78' : (clusterHealth === 'warning' ? '#ffb300' : '#f44336'), display: 'inline-block', marginRight: 8 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#222', mr: 2 }}>{cluster.name}</Typography>
                      </Box>
                      <Box className="cluster-status" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, color: textSecondary }}>
                        <span className="status-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#48BB78', display: 'inline-block', marginRight: 4 }} />
                        {`${cluster.nodes.filter(n => n.healthStatus === 'healthy').length}/${cluster.nodes.length} nodes healthy`}
                      </Box>
                    </Box>
                    <Tooltip title="Delete Cluster">
                      <IconButton onClick={() => handleDeleteCluster(cluster.id)} color="error" aria-label="Delete Cluster">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" sx={{ color: textPrimary, mb: 1 }}>
                    <b>Algorithm:</b> {cluster.algorithm}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textPrimary, mb: 1 }}>
                    <b>Health Check:</b> <span style={{ color: textSecondary }}>{cluster.healthCheckEndpoint}</span> (every {cluster.healthCheckFrequency} seconds)
                  </Typography>
                  <Typography variant="body2" sx={{ color: textPrimary, mb: 2 }}>
                    <b>Nodes:</b> {cluster.nodes.length}
                  </Typography>
                  {/* Node List as Table */}
                  <Box sx={{ overflowX: 'auto', mb: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: colors.timberwolf }}>
                          <th style={{ padding: 8, textAlign: 'center' }}>
                            <Tooltip title="Select all nodes">
                              <Checkbox
                                checked={cluster.nodes.length > 0 && cluster.nodes.every(n => selectedNodes[n.id])}
                                indeterminate={cluster.nodes.some(n => selectedNodes[n.id]) && !cluster.nodes.every(n => selectedNodes[n.id])}
                                onChange={() => {
                                  const allSelected = cluster.nodes.every(n => selectedNodes[n.id]);
                                  const newSelected: {[key: string]: boolean} = {};
                                  for (const n of cluster.nodes) { newSelected[n.id] = !allSelected; }
                                  setSelectedNodes(newSelected);
                                }}
                                size="small"
                              />
                            </Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Node status (active/down)"><span>Status</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Node address"><span>URL</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Average response time (ms)"><span>Response Time</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Current requests/sec"><span>Load</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="How long node has been running"><span>Uptime</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Node weight for weighted round-robin"><span>Weight</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Last health check"><span>Last Checked</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Node health status"><span>Health</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Active connections"><span>Connections</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>
                            <Tooltip title="Error rate (failed/total requests)"><span>Error Rate (%)</span></Tooltip>
                          </th>
                          <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>
                            Actions
                          </th>
                          <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>
                            <Tooltip title="Expand/collapse details"><span> </span></Tooltip>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cluster.nodes.map((node, idx) => {
                          const isSelected = !!selectedNodes[node.id];
                          const isExpanded = !!expandedRows[node.id];
                          const rowBg = idx % 2 === 0 ? '#fff' : 'rgba(232, 196, 160, 0.1)';
                          return <>
                            <tr
                              key={node.id}
                              style={{ background: rowBg, borderBottom: `1px solid ${colors.timberwolf}`, transition: 'background 0.2s', cursor: 'pointer' }}
                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={(e) => handleMouseLeave(e, rowBg)}
                            >
                              <td style={{ textAlign: 'center' }}>
                                <Checkbox checked={isSelected} onChange={() => handleSelectNode(node.id)} size="small" />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block', background: node.isActive ? '#48BB78' : '#f44336' }} />
                              </td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{node.url}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{typeof node.responseTime === 'number' ? `${node.responseTime.toFixed(2)}ms` : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{typeof node.requestsPerSec === 'number' ? node.requestsPerSec.toFixed(2) : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{node.createdAt ? `${Math.floor((Date.now() - new Date(node.createdAt).getTime()) / 1000 / 60)} min` : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{typeof node.weight === 'number' ? node.weight : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: textTertiary, verticalAlign: 'middle' }} />
                                <span style={{ color: textTertiary, fontSize: 13 }}>{new Date(node.lastChecked).toLocaleString()}</span>
                              </td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>
                                <Tooltip title={node.healthStatus.charAt(0).toUpperCase() + node.healthStatus.slice(1)}>
                        <Chip
                          label={node.healthStatus}
                          sx={node.healthStatus === 'healthy' ? healthyStatus : errorStatus}
                          size="small"
                          style={{ textTransform: 'capitalize' }}
                                    aria-label={node.healthStatus}
                                  />
                                </Tooltip>
                              </td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{typeof node.connections === 'number' ? node.connections : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle' }}>{typeof node.errorRate === 'number' ? `${node.errorRate.toFixed(2)}%` : 'N/A'}</td>
                              <td style={{ padding: 8, verticalAlign: 'middle', textAlign: 'center' }}>
                                <Box className={styles['action-group']}>
                        <Tooltip title="Check Health">
                                    <span>
                                      <IconButton edge="end" onClick={() => handleCheckHealth(cluster.id, node.id)} sx={refreshIcon} disabled={checkingNodeId === node.id} aria-label="Check Health">
                                        {checkingNodeId === node.id ? <CircularProgress size={20} /> : <RefreshIcon />}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Drain Node">
                                    <IconButton edge="end" onClick={() => handleDrainNode(cluster.id, node.id)} className={styles['secondary-action']} aria-label="Drain Node">
                                      <HealthAndSafetyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Node">
                                    <IconButton edge="end" onClick={() => handleDeleteNode(cluster.id, node.id)} sx={deleteIcon} aria-label="Remove Node">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                                </Box>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <IconButton size="small" onClick={() => handleExpandRow(node.id)} aria-label="Expand Row">
                                  <ExpandMoreIcon style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </IconButton>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="row-link"
                                  onClick={() => navigate(`/clusters/${cluster.id}/nodes/${node.id}`)}
                                  tabIndex={0}
                                  aria-label="View node details"
                                  style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontWeight: 600 }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                            <tr key={`${node.id}-expanded`}>
                              <td colSpan={12} style={{ padding: 0, border: 0 }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ p: 2, background: '#f9f6f2', borderBottom: `1px solid ${colors.timberwolf}` }}>
                                    <Typography variant="body2">Detailed node metrics coming soon...</Typography>
                  </Box>
                                </Collapse>
                              </td>
                            </tr>
                          </>;
                        })}
                      </tbody>
                    </table>
                  </Box>
                  <Box className={styles['action-group']} sx={{ mb: 2, justifyContent: 'flex-end' }}>
                    <Button className={styles['primary-action']} onClick={() => { setSelectedCluster(cluster.id); setOpenNodeDialog(true); }} startIcon={<AddIcon />} aria-label="Add Node">Add Node</Button>
                    <Button className={styles['secondary-action']} onClick={() => handleTestAllNodes(cluster.id)} startIcon={<RefreshIcon />} aria-label="Test All Nodes">Test All Nodes</Button>
                    <Button className={styles['secondary-action']} disabled={Object.values(selectedNodes).filter(Boolean).length === 0} onClick={() => handleBulkDrain(cluster.id)} aria-label="Drain Selected">Drain Selected</Button>
                    <Button className={styles['secondary-action']} disabled={Object.values(selectedNodes).filter(Boolean).length === 0} color="error" onClick={() => handleBulkDelete(cluster.id)} aria-label="Delete Selected">Delete Selected</Button>
                  </Box>
                  <ClusterTabs
                    cluster={cluster}
                    nodes={cluster.nodes}
                    nodesMetrics={nodeMetrics}
                    autoRefresh={autoRefresh}
                    refreshInterval={refreshInterval / 1000}
                    onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
                    onChangeInterval={(interval) => setRefreshInterval(interval * 1000)}
                  />
                  {editingCluster === cluster.id ? (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        label="Health Check Endpoint"
                        fullWidth
                        value={editHealthCheckEndpoint}
                        onChange={(e) => setEditHealthCheckEndpoint(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        margin="dense"
                        label="Health Check Frequency (seconds)"
                        fullWidth
                        type="number"
                        value={editHealthCheckFrequency}
                        onChange={(e) => {
                          const value = Math.max(1, Number.parseInt(e.target.value, 10));
                          setEditHealthCheckFrequency(value);
                        }}
                        inputProps={{ min: 1 }}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Save">
                          <IconButton onClick={() => handleSaveCluster(cluster.id)} sx={refreshIcon}>
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton onClick={handleCancelEdit} sx={deleteIcon}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Tooltip title="Edit Cluster">
                        <IconButton onClick={() => handleEditCluster(cluster)} sx={refreshIcon}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Cluster Dialog */}
      <Dialog 
        open={openClusterDialog} 
        onClose={() => setOpenClusterDialog(false)}
        maxWidth={false}
      >
        <DialogTitle sx={{
          color: textPrimary,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1.25rem',
          pb: 0,
          position: 'relative'
        }}>
          Create New Cluster
          <IconButton
            onClick={() => setOpenClusterDialog(false)}
            sx={{
              position: 'absolute',
              top: 5,
              right: 5
            }}
            aria-label="Close Dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{
          pt: 1,
          pb: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          sx: { mb: 2.5 },
          background: cardBackground
        }}>
          <form onSubmit={handleCreateCluster} style={{ width: '100%' }}>
            <TextField
              autoFocus
              margin="normal"
              label="Cluster Name"
              fullWidth
              value={newCluster.name}
              onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })}
              required
              inputProps={{ maxLength: 50 }}
              helperText="Enter a name for your cluster (max 50 characters)"
            />
            <TextField
              margin="normal"
              label="Health Check Endpoint"
              fullWidth
              value={newCluster.healthCheckEndpoint}
              onChange={(e) => setNewCluster({ ...newCluster, healthCheckEndpoint: e.target.value })}
              placeholder="/health"
              helperText="Enter the health check endpoint path (e.g., /health)"
              required
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              margin="normal"
              label="Health Check Frequency (seconds)"
              fullWidth
              type="number"
              value={newCluster.healthCheckFrequency}
              onChange={handleHealthCheckFrequencyChange}
              inputProps={{ min: 1, max: 300 }}
              required
              helperText="Enter frequency between 1 and 300 seconds"
            />
            <TextField
              select
              margin="normal"
              label="Load Balancing Algorithm"
              fullWidth
              value={newCluster.algorithm}
              onChange={(e) => setNewCluster({ ...newCluster, algorithm: e.target.value })}
              required
              helperText="Select the load balancing algorithm"
            >
              <MenuItem value="round-robin">Round Robin</MenuItem>
              <MenuItem value="least-connections">Least Connections</MenuItem>
              <MenuItem value="weighted-round-robin">Weighted Round Robin</MenuItem>
              <MenuItem value="ip-hash">IP Hash</MenuItem>
              <MenuItem value="least-response-time">Least Response Time</MenuItem>
            </TextField>
            <Box sx={{ mt: 1, mb: 2, background: '#f9f6f2', borderRadius: 1, p: 1.5, fontSize: 14, color: 'var(--text-secondary)' }}>
              <b>Algorithm Info:</b><br />
              <b>Round Robin:</b> Evenly distributes requests.<br />
              <b>Weighted Round Robin:</b> Distributes based on node weights.<br />
              <b>Least Connections:</b> Chooses node with fewest active connections.<br />
              <b>IP Hash:</b> Routes based on client IP.<br />
              <b>Least Response Time:</b> Chooses node with lowest response time.
            </Box>
          </form>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success" sx={{ mt: 2 }}>
              {success}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setOpenClusterDialog(false)} sx={secondaryButton} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCluster} 
            variant="contained" 
            sx={primaryButton}
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isCreating ? 'Creating...' : 'Create Cluster'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Node Dialog */}
      <Dialog 
        open={openNodeDialog} 
        onClose={() => !isAddingNode && setOpenNodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: cardBackground,
          color: textPrimary,
          borderBottom: cardBorder,
          padding: '16px 24px'
        }}>
          Add New Node
        </DialogTitle>
        <DialogContent sx={{ 
          backgroundColor: cardBackground,
          padding: 3,
          '& .MuiTextField-root': {
            marginBottom: 2,
            '& .MuiOutlinedInput-root': {
              color: textPrimary,
              '& fieldset': {
                borderColor: cardBorder,
              },
              '&:hover fieldset': {
                borderColor: textPrimary,
              },
              '& input': {
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            },
            '& .MuiInputLabel-root': {
              color: textSecondary,
            },
            '& .MuiFormHelperText-root': {
              color: textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }
        }}>
          <TextField
            autoFocus
            margin="dense"
            label="Node URL"
            fullWidth
            value={newNodeUrl}
            onChange={(e) => setNewNodeUrl(e.target.value)}
            placeholder="http://example.com:8080"
            helperText="Enter the node's base URL (e.g., http://example.com:8080)"
            inputProps={{ maxLength: 200 }}
            disabled={isAddingNode}
          />
          <TextField
            margin="dense"
            label="Node Weight"
            type="number"
            fullWidth
            value={newNodeWeight}
            onChange={e => setNewNodeWeight(Math.max(1, Math.min(100, Number(e.target.value))))}
            inputProps={{ min: 1, max: 100 }}
            helperText="Set the node's weight (1-100, for weighted load balancing)"
            disabled={isAddingNode}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: cardBackground,
          padding: 2,
          borderTop: cardBorder
        }}>
          <Button 
            onClick={() => setOpenNodeDialog(false)}
            sx={secondaryButton}
            disabled={isAddingNode}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleAddNode(selectedCluster as string)} 
            variant="contained"
            sx={primaryButton}
            disabled={isAddingNode}
            startIcon={isAddingNode ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isAddingNode ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ClusterManagement; 