import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface AddServerRequest {
  url: string;
  weight: number;
}

export interface ServerStats {
  totalRequests: number;
  activeRequests: number;
  failedRequests: number;
  lastResponseTime: number;
}

export interface Server {
  id: string;
  url: string;
  weight: number;
  isActive: boolean;
  stats: ServerStats;
}

class LoadBalancerService {
  async addServer(server: AddServerRequest): Promise<string> {
    const response = await axios.post<{ id: string }>(`${API_BASE_URL}/servers`, server);
    return response.data.id;
  }

  async removeServer(serverId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/servers?id=${serverId}`);
  }

  async getStats(): Promise<Record<string, Server>> {
    const response = await axios.get<Record<string, Server>>(`${API_BASE_URL}/stats`);
    return response.data;
  }

  async checkHealth(): Promise<{ status: string }> {
    const response = await axios.get<{ status: string }>(`${API_BASE_URL}/health`);
    return response.data;
  }
}

export const loadBalancerService = new LoadBalancerService(); 