import { useState, useEffect, useCallback } from 'react';
import { clusterService, type Cluster, type CreateClusterRequest } from '../services/clusterService';
import { colors } from '../theme/colors';
import { 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Typography, 
  Grid,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
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
  const [error, setError] = useState<string>('');
  const [editingCluster, setEditingCluster] = useState<string | null>(null);
  const [editHealthCheckEndpoint, setEditHealthCheckEndpoint] = useState('');
  const [editHealthCheckFrequency, setEditHealthCheckFrequency] = useState(0);
  const [success, setSuccess] = useState<string>('');

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
    fetchClusters();
    // Set up periodic refresh
    const interval = setInterval(fetchClusters, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchClusters]);

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clusterService.createCluster(newCluster);
      setNewCluster({
        name: '',
        algorithm: 'round-robin',
        healthCheckEndpoint: '',
        healthCheckFrequency: 30
      });
      fetchClusters();
      setOpenClusterDialog(false);
    } catch (err) {
      setError('Failed to create cluster');
    }
  };

  const handleAddNode = async (clusterId: string) => {
    try {
      await clusterService.addNode(clusterId, newNodeUrl);
      setNewNodeUrl('');
      fetchClusters();
      setOpenNodeDialog(false);
    } catch (err) {
      setError('Failed to add node');
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    try {
      await clusterService.deleteCluster(clusterId);
      fetchClusters();
      setError('');
    } catch (err) {
      setError('Failed to delete cluster');
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
      setError('Failed to delete node');
      console.error('Error deleting node:', err);
    }
  };

  const handleCheckHealth = async (clusterId: string, nodeId: string) => {
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
    } catch (err) {
      setError('Failed to check node health');
      console.error('Error checking node health:', err);
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
      setSuccess('Cluster updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update cluster');
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
                color: colors.linen,
                fontWeight: 700,
                borderRadius: 3,
                px: 5,
                py: 1.7,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                textTransform: 'none',
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: colors.champagnePink,
                  color: colors.linen,
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
              </TextField>
            </form>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={() => setOpenClusterDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleCreateCluster} variant="contained" color="primary">
              Create Cluster
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenClusterDialog(true)}
          sx={primaryButton}
        >
          Create Cluster
        </Button>
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

      <Grid container spacing={3}>
        {clusters.map((cluster) => {
          const clusterHealth = getClusterHealthStatus(cluster);
          const clusterStatusColor = clusterHealth === 'healthy' ? '#4caf50' : clusterHealth === 'warning' ? '#ffb300' : '#f44336';
          const clusterStatusLabel = clusterHealth === 'healthy' ? 'Healthy' : clusterHealth === 'warning' ? 'Warning' : 'Unhealthy';
          const clusterStatusIcon = clusterHealth === 'healthy' ? <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18, mr: 1 }} /> : clusterHealth === 'warning' ? <WarningIcon sx={{ color: '#ffb300', fontSize: 18, mr: 1 }} /> : <ErrorIcon sx={{ color: '#f44336', fontSize: 18, mr: 1 }} />;

          return (
            <Grid item xs={12} sm={6} md={4} key={cluster.id}>
              <Card elevation={4} sx={{
                background: cardBackground,
                color: textPrimary,
                borderRadius: cardRadius,
                boxShadow: cardShadow,
                p: 3,
                mb: 3,
                transition: 'box-shadow 0.2s, transform 0.2s',
                border: cardBorder,
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px) scale(1.01)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600, mr: 1 }}>
                      {window.location.origin}{cluster.publicEndpoint}
                    </Typography>
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(window.location.origin + cluster.publicEndpoint)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="span"
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: clusterStatusColor,
                          display: 'inline-block',
                          mr: 1,
                          border: '2px solid #fff',
                        }}
                        aria-label={clusterStatusLabel}
                      />
                      <Typography variant="h6" sx={{ color: '#333', fontWeight: 700 }}>{cluster.name}</Typography>
                    </Box>
                    <Tooltip title="Delete Cluster">
                      <IconButton onClick={() => handleDeleteCluster(cluster.id)} color="error">
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
                  <List dense sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {cluster.nodes.map((node) => (
                      <ListItem key={node.id} sx={{ mb: 2, borderRadius: 2, background: colors.timberwolf, transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transform: 'scale(1.01)' } }}>
                        <Avatar sx={{ bgcolor: node.healthStatus === 'healthy' ? colors.timberwolf : colors.champagnePink, mr: 2 }}>
                          {node.url[0].toUpperCase()}
                        </Avatar>
                        <ListItemText
                          primary={<span style={{ color: textPrimary }}>{node.url}</span>}
                          secondary={
                            <>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: textTertiary }} />
                              <Typography variant="body2" sx={{ color: textTertiary, fontSize: 13 }}>Last checked: {new Date(node.lastChecked).toLocaleString()}</Typography>
                            </>
                          }
                        />
                        <Chip
                          label={node.healthStatus}
                          sx={node.healthStatus === 'healthy' ? healthyStatus : errorStatus}
                          size="small"
                          style={{ textTransform: 'capitalize' }}
                        />
                        <Tooltip title="Check Health">
                          <IconButton edge="end" onClick={() => handleCheckHealth(cluster.id, node.id)} sx={refreshIcon}>
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Node">
                          <IconButton edge="end" onClick={() => handleDeleteNode(cluster.id, node.id)} sx={deleteIcon}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Tooltip title="Add Node">
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedCluster(cluster.id);
                          setOpenNodeDialog(true);
                        }}
                        sx={primaryButton}
                      >
                        Add Node
                      </Button>
                    </Tooltip>
                  </Box>
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
            </TextField>
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
          <CircularProgress />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setOpenClusterDialog(false)} sx={secondaryButton}>
            Cancel
          </Button>
          <Button onClick={handleCreateCluster} variant="contained" sx={primaryButton}>
            Create Cluster
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Node Dialog */}
      <Dialog 
        open={openNodeDialog} 
        onClose={() => setOpenNodeDialog(false)}
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
            inputProps={{
              maxLength: 200
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: cardBackground,
          padding: 2,
          borderTop: cardBorder
        }}>
          <Button 
            onClick={() => setOpenNodeDialog(false)}
            sx={secondaryButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleAddNode(selectedCluster as string)} 
            variant="contained"
            sx={primaryButton}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterManagement; 