import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CircularProgress, Grid } from '@mui/material';
import { clusterService, type NodeMetric } from '../services/clusterService';

const NodeDetails: React.FC = () => {
  const { clusterId, nodeId } = useParams<{ clusterId: string; nodeId: string }>();
  const [nodeMetric, setNodeMetric] = useState<NodeMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clusterId || !nodeId) return;
    setLoading(true);
    clusterService.getNodeMetrics(clusterId)
      .then(metrics => {
        const found = metrics.find(m => m.id === nodeId);
        setNodeMetric(found || null);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch node metrics');
        setLoading(false);
      });
  }, [clusterId, nodeId]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>;
  if (!nodeMetric) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>No data found for this node.</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, minHeight: '100vh', background: '#f9f6f2' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Node Details</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">{nodeMetric.url}</Typography>
          <Typography>ID: {nodeMetric.id}</Typography>
          <Typography>Connections: {nodeMetric.connections}</Typography>
          <Typography>Error Rate: {nodeMetric.errorRate.toFixed(2)}%</Typography>
          <Typography>CPU: {nodeMetric.cpu}%</Typography>
          <Typography>Memory: {nodeMetric.memory}%</Typography>
          <Typography>Requests: {nodeMetric.requests}</Typography>
          <Typography>Success: {nodeMetric.success}</Typography>
          <Typography>Failure: {nodeMetric.failure}</Typography>
        </CardContent>
      </Card>
      <Grid container spacing={3}>
        {/* Placeholder for real-time charts (reuse chart code as needed) */}
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography>Real-time charts coming soon...</Typography></CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NodeDetails; 