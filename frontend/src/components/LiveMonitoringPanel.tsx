import type React from 'react';
import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, Slider, Typography, Button, Grid } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SettingsIcon from '@mui/icons-material/Settings';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, ChartTooltip, Legend);

// Mock data for demonstration
const mockNodes = [
  { id: '1', url: 'http://127.0.0.1:3001', requests: 120, success: 115, failure: 5, cpu: 32, memory: 60, connections: 10 },
  { id: '2', url: 'http://127.0.0.1:3002', requests: 80, success: 75, failure: 5, cpu: 45, memory: 50, connections: 7 },
  { id: '3', url: 'http://127.0.0.1:3000', requests: 100, success: 98, failure: 2, cpu: 28, memory: 40, connections: 5 },
];

const defaultIntervals = [2, 5, 10, 30];

export interface NodeMetric {
  id: string;
  url: string;
  requests: number;
  success: number;
  failure: number;
  cpu: number;
  memory: number;
  connections: number;
}

interface LiveMonitoringPanelProps {
  nodes?: NodeMetric[];
  autoRefresh: boolean;
  refreshInterval: number;
  onToggleAutoRefresh: () => void;
  onChangeInterval: (interval: number) => void;
  interval?: string;
}

const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  nodes = mockNodes,
  autoRefresh,
  refreshInterval,
  onToggleAutoRefresh,
  onChangeInterval,
  interval = '1h',
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trendData, setTrendData] = useState<{
    rps: number[];
    respTime: number[];
    errorRate: number[];
    bandwidth: number[];
    labels: string[];
  }>({
    rps: [],
    respTime: [],
    errorRate: [],
    bandwidth: [],
    labels: [],
  });

  useEffect(() => {
    // Simulate different data for each interval
    let labels: string[] = [];
    let rps: number[] = [];
    let respTime: number[] = [];
    let errorRate: number[] = [];
    let bandwidth: number[] = [];
    switch (interval) {
      case '5m':
        labels = Array.from({ length: 5 }, (_, i) => `${5 - i}m ago`).reverse();
        rps = [18, 19, 20, 21, 22];
        respTime = [110, 112, 108, 115, 113];
        errorRate = [0.2, 0.3, 0.1, 0.2, 0.1];
        bandwidth = [1.5, 1.6, 1.7, 1.8, 1.9];
        break;
      case '30m':
        labels = Array.from({ length: 6 }, (_, i) => `${(i + 1) * 5}m ago`).reverse();
        rps = [15, 16, 17, 18, 19, 20];
        respTime = [120, 118, 122, 119, 121, 117];
        errorRate = [0.4, 0.3, 0.5, 0.4, 0.3, 0.2];
        bandwidth = [1.2, 1.3, 1.4, 1.5, 1.6, 1.7];
        break;
      case '1h':
        labels = Array.from({ length: 12 }, (_, i) => `${(i + 1) * 5}m ago`).reverse();
        rps = [10, 12, 15, 14, 13, 16, 18, 17, 15, 14, 13, 12];
        respTime = [120, 110, 115, 130, 125, 118, 112, 120, 122, 119, 117, 115];
        errorRate = [0.5, 0.7, 0.6, 0.8, 0.4, 0.3, 0.2, 0.5, 0.6, 0.7, 0.5, 0.4];
        bandwidth = [1.2, 1.3, 1.1, 1.4, 1.5, 1.6, 1.7, 1.5, 1.4, 1.3, 1.2, 1.1];
        break;
      case '3h':
        labels = Array.from({ length: 6 }, (_, i) => `${(i + 1) * 30}m ago`).reverse();
        rps = [8, 9, 10, 11, 12, 13];
        respTime = [130, 128, 132, 129, 131, 127];
        errorRate = [0.6, 0.5, 0.7, 0.6, 0.5, 0.4];
        bandwidth = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
        break;
      case '24h':
        labels = Array.from({ length: 8 }, (_, i) => `${(i + 1) * 3}h ago`).reverse();
        rps = [7, 8, 9, 10, 11, 12, 13, 14];
        respTime = [140, 138, 142, 139, 141, 137, 135, 133];
        errorRate = [0.8, 0.7, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
        bandwidth = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
        break;
      case '2d':
        labels = Array.from({ length: 8 }, (_, i) => `${(i + 1) * 6}h ago`).reverse();
        rps = [6, 7, 8, 9, 10, 11, 12, 13];
        respTime = [150, 148, 152, 149, 151, 147, 145, 143];
        errorRate = [1.0, 0.9, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6];
        bandwidth = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
        break;
      case '7d':
        labels = Array.from({ length: 7 }, (_, i) => `${(i + 1)}d ago`).reverse();
        rps = [5, 6, 7, 8, 9, 10, 11];
        respTime = [160, 158, 162, 159, 161, 157, 155];
        errorRate = [1.2, 1.1, 1.3, 1.2, 1.1, 1.0, 0.9];
        bandwidth = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2];
        break;
      default:
        labels = [];
        rps = [];
        respTime = [];
        errorRate = [];
        bandwidth = [];
    }
    setTrendData({ rps, respTime, errorRate, bandwidth, labels });
  }, [interval]);

  // Chart data
  const requestDistData = {
    labels: nodes.map((n) => n.url),
    datasets: [
      {
        label: 'Requests',
        data: nodes.map((n) => n.requests),
        backgroundColor: ['#48BB78', '#f6ad55', '#63b3ed'],
      },
    ],
  };

  const successFailData = {
    labels: nodes.map((n) => n.url),
    datasets: [
      {
        label: 'Success',
        data: nodes.map((n) => n.success),
        backgroundColor: '#48BB78',
      },
      {
        label: 'Failure',
        data: nodes.map((n) => n.failure),
        backgroundColor: '#f56565',
      },
    ],
  };

  const cpuMemData = {
    labels: nodes.map((n) => n.url),
    datasets: [
      {
        label: 'CPU (%)',
        data: nodes.map((n) => n.cpu),
        borderColor: '#63b3ed',
        backgroundColor: 'rgba(99,179,237,0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Memory (%)',
        data: nodes.map((n) => n.memory),
        borderColor: '#f6ad55',
        backgroundColor: 'rgba(246,173,85,0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const connErrData = {
    labels: nodes.map((n) => n.url),
    datasets: [
      {
        label: 'Connections',
        data: nodes.map((n) => n.connections),
        backgroundColor: '#805ad5',
      },
      {
        label: 'Error Rate (%)',
        data: nodes.map((n) => (n.requests ? (n.failure / n.requests) * 100 : 0)),
        backgroundColor: '#f56565',
      },
    ],
  };

  const rpsTrendData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Requests/sec',
        data: trendData.rps,
        borderColor: '#63b3ed',
        backgroundColor: 'rgba(99,179,237,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const respTimeTrendData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: trendData.respTime,
        borderColor: '#f6ad55',
        backgroundColor: 'rgba(246,173,85,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const errorRateTrendData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Error Rate (%)',
        data: trendData.errorRate,
        borderColor: '#f56565',
        backgroundColor: 'rgba(245,101,101,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const bandwidthTrendData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Bandwidth (MBps)',
        data: trendData.bandwidth,
        borderColor: '#805ad5',
        backgroundColor: 'rgba(128,90,213,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <Box sx={{ mb: 4, p: 2, background: '#fff', borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'right', color: 'var(--text-secondary)' }}>
        Interval: {interval}
      </Typography>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Current Metrics</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 1 }}>
        <Tooltip title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}>
          <IconButton onClick={onToggleAutoRefresh} color={autoRefresh ? 'primary' : 'default'}>
            {autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Request Distribution</Typography>
          <Pie data={requestDistData} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Success/Failure Rate</Typography>
          <Bar data={successFailData} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>CPU/Memory Usage</Typography>
          <Line data={cpuMemData} options={{
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
              y: { type: 'linear', display: true, position: 'left', min: 0, max: 100 },
              y1: { type: 'linear', display: true, position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } },
            },
          }} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Connections & Error Rate</Typography>
          <Bar data={connErrData} />
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>Trends</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Requests per Second (RPS)</Typography>
          {trendData.labels.length ? <Line data={rpsTrendData} /> : <Typography color="textSecondary">No data</Typography>}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Avg Response Time</Typography>
          {trendData.respTime.length ? <Line data={respTimeTrendData} /> : <Typography color="textSecondary">No data</Typography>}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Error Rate Trend</Typography>
          {trendData.errorRate.length ? <Line data={errorRateTrendData} /> : <Typography color="textSecondary">No data</Typography>}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Bandwidth Usage</Typography>
          {trendData.bandwidth.length ? <Line data={bandwidthTrendData} /> : <Typography color="textSecondary">No data</Typography>}
        </Grid>
      </Grid>
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Auto-Refresh Settings</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Refresh Interval (seconds)</Typography>
          <Slider
            value={refreshInterval}
            min={1}
            max={60}
            step={1}
            marks={defaultIntervals.map((v) => ({ value: v, label: `${v}s` }))}
            onChange={(_, val) => typeof val === 'number' && onChangeInterval(val)}
            valueLabelDisplay="auto"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setSettingsOpen(false)} variant="contained">Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LiveMonitoringPanel; 