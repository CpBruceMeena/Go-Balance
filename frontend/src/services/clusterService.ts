import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface Node {
  id: string;
  url: string;
  isActive: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastChecked: string;
}

export interface Cluster {
  id: string;
  name: string;
  algorithm: string;
  nodes: Node[];
  healthCheckEndpoint: string;
  healthCheckFrequency: number;
  createdAt: string;
  updatedAt: string;
  publicEndpoint: string;
}

export interface CreateClusterRequest {
  name: string;
  algorithm: string;
  healthCheckEndpoint: string;
  healthCheckFrequency: number;
}

export const clusterService = {
  async getClusters(): Promise<Cluster[]> {
    const response = await axios.get<Cluster[]>(`${API_BASE_URL}/clusters`);
    return response.data;
  },

  async createCluster(cluster: CreateClusterRequest): Promise<Cluster> {
    const response = await axios.post<Cluster>(`${API_BASE_URL}/clusters`, cluster);
    return response.data;
  },

  async deleteCluster(clusterId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/clusters/${clusterId}`);
  },

  async addNode(clusterId: string, url: string): Promise<Node> {
    const response = await axios.post<{ node: Node }>(`${API_BASE_URL}/clusters/${clusterId}/nodes`, {
      url,
    });
    return response.data.node;
  },

  async deleteNode(clusterId: string, nodeId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeId}`);
  },

  async checkNodeHealth(clusterId: string, nodeId: string): Promise<Node> {
    const response = await axios.get<Node>(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeId}/health`);
    return response.data;
  },

  async updateClusterAlgorithm(clusterId: string, algorithm: Cluster['algorithm']): Promise<Cluster> {
    const response = await axios.put<Cluster>(`${API_BASE_URL}/clusters/${clusterId}/algorithm`, { algorithm });
    return response.data;
  },

  async updateCluster(clusterId: string, data: { healthCheckEndpoint: string; healthCheckFrequency: number }): Promise<Cluster> {
    const response = await axios.put<Cluster>(`${API_BASE_URL}/clusters/${clusterId}`, data);
    return response.data;
  }
}; 