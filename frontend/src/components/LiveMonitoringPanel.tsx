import type React from 'react';
import { useState } from 'react';
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
}

const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  nodes = mockNodes,
  autoRefresh,
  refreshInterval,
  onToggleAutoRefresh,
  onChangeInterval,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <Box sx={{ mb: 4, p: 2, background: '#fff', borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
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