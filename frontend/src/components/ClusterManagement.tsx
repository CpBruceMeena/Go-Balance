import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { colors } from '../theme/colors';
import { clusterService } from '../services/clusterService';
import type { Cluster, Node } from '../services/clusterService';

const ClusterManagement = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [openClusterDialog, setOpenClusterDialog] = useState(false);
  const [openNodeDialog, setOpenNodeDialog] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterHealthCheckEndpoint, setNewClusterHealthCheckEndpoint] = useState('/health');
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    try {
      setLoading(true);
      const data = await clusterService.getClusters();
      setClusters(data);
      setError(null);
    } catch (err) {
      setError('Failed to load clusters');
      console.error('Error loading clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCluster = async () => {
    if (newClusterName.trim()) {
      try {
        const newCluster = await clusterService.createCluster(
          newClusterName,
          newClusterHealthCheckEndpoint
        );
        setClusters([...clusters, newCluster]);
        setNewClusterName('');
        setNewClusterHealthCheckEndpoint('/health');
        setOpenClusterDialog(false);
        setError(null);
      } catch (err) {
        setError('Failed to create cluster');
        console.error('Error creating cluster:', err);
      }
    }
  };

  const handleAddNode = async () => {
    if (selectedCluster && newNodeUrl.trim()) {
      try {
        const newNode = await clusterService.addNode(selectedCluster, newNodeUrl);
        setClusters(clusters.map(cluster => 
          cluster.id === selectedCluster
            ? { ...cluster, nodes: [...cluster.nodes, newNode] }
            : cluster
        ));
        setNewNodeUrl('');
        setOpenNodeDialog(false);
        setError(null);
      } catch (err) {
        setError('Failed to add node');
        console.error('Error adding node:', err);
      }
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    try {
      await clusterService.deleteCluster(clusterId);
      setClusters(clusters.filter(cluster => cluster.id !== clusterId));
      setError(null);
    } catch (err) {
      setError('Failed to delete cluster');
      console.error('Error deleting cluster:', err);
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
      setError(null);
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
      setError(null);
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
      setError(null);
    } catch (err) {
      setError('Failed to update algorithm');
      console.error('Error updating algorithm:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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
          <Grid item xs={12} md={6} key={cluster.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{cluster.name}</Typography>
                  <IconButton
                    onClick={() => handleDeleteCluster(cluster.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Load Balancing Algorithm</InputLabel>
                  <Select
                    value={cluster.algorithm}
                    label="Load Balancing Algorithm"
                    onChange={(e) => handleUpdateAlgorithm(cluster.id, e.target.value as Cluster['algorithm'])}
                  >
                    <MenuItem value="round-robin">Round Robin</MenuItem>
                    <MenuItem value="least-connections">Least Connections</MenuItem>
                    <MenuItem value="weighted-round-robin">Weighted Round Robin</MenuItem>
                  </Select>
                </FormControl>

                <List>
                  {cluster.nodes.map((node) => (
                    <ListItem key={node.id}>
                      <ListItemText
                        primary={node.url}
                        secondary={`Last checked: ${new Date(node.lastChecked).toLocaleString()}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={node.healthStatus}
                          color={node.healthStatus === 'healthy' ? 'success' : 'error'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          edge="end"
                          onClick={() => handleCheckHealth(cluster.id, node.id)}
                          sx={{ mr: 1 }}
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteNode(cluster.id, node.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedCluster(cluster.id);
                    setOpenNodeDialog(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  Add Node
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Cluster Dialog */}
      <Dialog open={openClusterDialog} onClose={() => setOpenClusterDialog(false)}>
        <DialogTitle>Create New Cluster</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cluster Name"
            fullWidth
            value={newClusterName}
            onChange={(e) => setNewClusterName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Health Check Endpoint"
            fullWidth
            value={newClusterHealthCheckEndpoint}
            onChange={(e) => setNewClusterHealthCheckEndpoint(e.target.value)}
            placeholder="/health"
            helperText="Enter the health check endpoint path (e.g., /health)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClusterDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCluster} variant="contained">
            Create
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
          <Button onClick={handleAddNode} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterManagement; 