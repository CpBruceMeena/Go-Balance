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

  const handleUpdateAlgorithm = async (clusterId: string, algorithm: Cluster['algorithm']) => {
    try {
      const updatedCluster = await clusterService.updateClusterAlgorithm(clusterId, algorithm);
      setClusters(clusters.map(cluster =>
        cluster.id === clusterId ? updatedCluster : cluster
      ));
      setError('');
    } catch (err) {
      setError('Failed to update algorithm');
      console.error('Error updating algorithm:', err);
    }
  };

  const handleHealthCheckFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCluster({ ...newCluster, healthCheckFrequency: Number.parseInt(e.target.value, 10) });
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
    } catch (err) {
      setError('Failed to update cluster');
    }
  };

  const handleCancelEdit = () => {
    setEditingCluster(null);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: colors.caribbeanCurrent }}>
          Cluster Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenClusterDialog(true)}
          sx={{
            backgroundColor: colors.caribbeanCurrent,
            '&:hover': {
              backgroundColor: colors.midnightGreen,
            },
          }}
        >
          Create Cluster
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {clusters.map((cluster) => (
          <Grid item xs={12} sm={6} md={4} key={cluster.id}>
            <Card elevation={4} sx={{ borderRadius: 3, background: colors.prussianBlue, border: `1px solid ${colors.midnightGreen}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HealthAndSafetyIcon sx={{ color: colors.caribbeanCurrent, mr: 1 }} />
                    <Typography variant="h6" sx={{ color: colors.caribbeanCurrent, fontWeight: 600 }}>{cluster.name}</Typography>
                  </Box>
                  <Tooltip title="Delete Cluster">
                    <IconButton onClick={() => handleDeleteCluster(cluster.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" sx={{ color: colors.midnightGreen, mb: 1 }}>
                  <b>Algorithm:</b> {cluster.algorithm}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.midnightGreen, mb: 1 }}>
                  <b>Health Check:</b> <span style={{ color: colors.caribbeanCurrent }}>{cluster.healthCheckEndpoint}</span> (every {cluster.healthCheckFrequency} seconds)
                </Typography>
                <Typography variant="body2" sx={{ color: colors.midnightGreen, mb: 2 }}>
                  <b>Nodes:</b> {cluster.nodes.length}
                </Typography>
                <List dense>
                  {cluster.nodes.map((node) => (
                    <ListItem key={node.id} sx={{ borderRadius: 2, mb: 1, background: colors.darkPurple2 }}>
                      <Avatar sx={{ bgcolor: node.healthStatus === 'healthy' ? colors.midnightGreen : colors.palatinate, mr: 2 }}>
                        {node.url[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={<span style={{ color: colors.caribbeanCurrent }}>{node.url}</span>}
                        secondary={<span style={{ color: colors.midnightGreen }}>Last checked: {new Date(node.lastChecked).toLocaleString()}</span>}
                      />
                      <Chip
                        label={node.healthStatus}
                        color={node.healthStatus === 'healthy' ? 'success' : 'error'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Check Health">
                        <IconButton edge="end" onClick={() => handleCheckHealth(cluster.id, node.id)} sx={{ mr: 1 }}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove Node">
                        <IconButton edge="end" onClick={() => handleDeleteNode(cluster.id, node.id)} color="error">
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
                      sx={{
                        backgroundColor: colors.caribbeanCurrent,
                        color: colors.prussianBlue,
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: colors.midnightGreen,
                          color: colors.caribbeanCurrent,
                        },
                      }}
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
                      label="Health Check Frequency (seconds)"
                      fullWidth
                      type="number"
                      value={editHealthCheckFrequency}
                      onChange={(e) => setEditHealthCheckFrequency(Number.parseInt(e.target.value, 10))}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Save">
                        <IconButton onClick={() => handleSaveCluster(cluster.id)} color="primary">
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton onClick={handleCancelEdit} color="error">
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Tooltip title="Edit Cluster">
                      <IconButton onClick={() => handleEditCluster(cluster)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Cluster Dialog */}
      <Dialog 
        open={openClusterDialog} 
        onClose={() => setOpenClusterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: colors.prussianBlue,
          color: colors.caribbeanCurrent,
          borderBottom: `1px solid ${colors.midnightGreen}`
        }}>
          Create New Cluster
        </DialogTitle>
        <DialogContent sx={{ 
          backgroundColor: colors.prussianBlue,
          padding: 3
        }}>
          <form onSubmit={handleCreateCluster}>
            <TextField
              autoFocus
              margin="dense"
              label="Cluster Name"
              fullWidth
              value={newCluster.name}
              onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: colors.caribbeanCurrent,
                  '& fieldset': {
                    borderColor: colors.midnightGreen,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.caribbeanCurrent,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.midnightGreen,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Health Check Endpoint"
              fullWidth
              value={newCluster.healthCheckEndpoint}
              onChange={(e) => setNewCluster({ ...newCluster, healthCheckEndpoint: e.target.value })}
              placeholder="/health"
              helperText="Enter the health check endpoint path (e.g., /health)"
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: colors.caribbeanCurrent,
                  '& fieldset': {
                    borderColor: colors.midnightGreen,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.caribbeanCurrent,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.midnightGreen,
                },
                '& .MuiFormHelperText-root': {
                  color: colors.midnightGreen,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Health Check Frequency (seconds)"
              fullWidth
              type="number"
              value={newCluster.healthCheckFrequency}
              onChange={handleHealthCheckFrequencyChange}
              inputProps={{ min: 5, max: 300 }}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: colors.caribbeanCurrent,
                  '& fieldset': {
                    borderColor: colors.midnightGreen,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.caribbeanCurrent,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.midnightGreen,
                },
              }}
            />
            <TextField
              select
              margin="dense"
              label="Load Balancing Algorithm"
              fullWidth
              value={newCluster.algorithm}
              onChange={(e) => setNewCluster({ ...newCluster, algorithm: e.target.value })}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: colors.caribbeanCurrent,
                  '& fieldset': {
                    borderColor: colors.midnightGreen,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.caribbeanCurrent,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.midnightGreen,
                },
              }}
            >
              <MenuItem value="round-robin">Round Robin</MenuItem>
              <MenuItem value="least-connections">Least Connections</MenuItem>
              <MenuItem value="weighted-round-robin">Weighted Round Robin</MenuItem>
            </TextField>
          </form>
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: colors.prussianBlue,
          padding: 2,
          borderTop: `1px solid ${colors.midnightGreen}`
        }}>
          <Button 
            onClick={() => setOpenClusterDialog(false)}
            sx={{ 
              color: colors.midnightGreen,
              '&:hover': {
                backgroundColor: colors.darkPurple2,
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCluster}
            variant="contained"
            sx={{
              backgroundColor: colors.caribbeanCurrent,
              color: colors.prussianBlue,
              '&:hover': {
                backgroundColor: colors.midnightGreen,
                color: colors.caribbeanCurrent,
              },
            }}
          >
            Create Cluster
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Node Dialog */}
      <Dialog open={openNodeDialog} onClose={() => setOpenNodeDialog(false)}>
        <DialogTitle>Add New Node</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Node URL"
            fullWidth
            value={newNodeUrl}
            onChange={(e) => setNewNodeUrl(e.target.value)}
            placeholder="http://example.com:8080"
            helperText="Enter the node's base URL (e.g., http://example.com:8080)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNodeDialog(false)}>Cancel</Button>
          <Button onClick={() => handleAddNode(selectedCluster as string)} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterManagement; 