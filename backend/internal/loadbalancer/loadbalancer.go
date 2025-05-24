package loadbalancer

import (
	"sync"
	"time"
)

// Server represents a backend server in the load balancer pool
type Server struct {
	ID          string
	URL         string
	Weight      int
	IsActive    bool
	HealthCheck *HealthCheck
	Stats       *ServerStats
	mu          sync.RWMutex
}

// ServerStats tracks server statistics
type ServerStats struct {
	TotalRequests    int64
	ActiveRequests   int64
	FailedRequests   int64
	LastResponseTime time.Duration
	mu               sync.RWMutex
}

// HealthCheck represents server health check configuration
type HealthCheck struct {
	Path               string
	Interval           time.Duration
	Timeout            time.Duration
	HealthyThreshold   int
	UnhealthyThreshold int
}

// LoadBalancer represents the main load balancer
type LoadBalancer struct {
	servers   []*Server
	algorithm string
	mu        sync.RWMutex
	nextIndex int
}

// NewLoadBalancer creates a new load balancer instance
func NewLoadBalancer(algorithm string) *LoadBalancer {
	return &LoadBalancer{
		servers:   make([]*Server, 0),
		algorithm: algorithm,
	}
}

// AddServer adds a new server to the pool
func (lb *LoadBalancer) AddServer(server *Server) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	lb.servers = append(lb.servers, server)
}

// RemoveServer removes a server from the pool
func (lb *LoadBalancer) RemoveServer(serverID string) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	for i, server := range lb.servers {
		if server.ID == serverID {
			lb.servers = append(lb.servers[:i], lb.servers[i+1:]...)
			break
		}
	}
}

// GetNextServer returns the next server based on the selected algorithm
func (lb *LoadBalancer) GetNextServer() *Server {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	if len(lb.servers) == 0 {
		return nil
	}

	switch lb.algorithm {
	case "round-robin":
		return lb.getNextServerRoundRobin()
	case "least-connections":
		return lb.getNextServerLeastConnections()
	case "weighted-round-robin":
		return lb.getNextServerWeightedRoundRobin()
	default:
		return lb.getNextServerRoundRobin()
	}
}

// getNextServerRoundRobin implements round-robin algorithm
func (lb *LoadBalancer) getNextServerRoundRobin() *Server {
	startIndex := lb.nextIndex
	for i := 0; i < len(lb.servers); i++ {
		index := (startIndex + i) % len(lb.servers)
		server := lb.servers[index]
		if server.IsActive {
			lb.nextIndex = (index + 1) % len(lb.servers)
			return server
		}
	}
	return nil
}

// getNextServerLeastConnections implements least-connections algorithm
func (lb *LoadBalancer) getNextServerLeastConnections() *Server {
	var selectedServer *Server
	var minConnections int64 = -1

	for _, server := range lb.servers {
		if !server.IsActive {
			continue
		}
		server.Stats.mu.RLock()
		activeRequests := server.Stats.ActiveRequests
		server.Stats.mu.RUnlock()

		if minConnections == -1 || activeRequests < minConnections {
			minConnections = activeRequests
			selectedServer = server
		}
	}
	return selectedServer
}

// getNextServerWeightedRoundRobin implements weighted round-robin algorithm
func (lb *LoadBalancer) getNextServerWeightedRoundRobin() *Server {
	var selectedServer *Server
	var maxWeight int = -1

	for _, server := range lb.servers {
		if !server.IsActive {
			continue
		}
		if server.Weight > maxWeight {
			maxWeight = server.Weight
			selectedServer = server
		}
	}
	return selectedServer
}

// GetServerStats returns statistics for all servers
func (lb *LoadBalancer) GetServerStats() map[string]interface{} {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	stats := make(map[string]interface{})
	for _, server := range lb.servers {
		server.Stats.mu.RLock()
		serverStats := map[string]interface{}{
			"total_requests":     server.Stats.TotalRequests,
			"active_requests":    server.Stats.ActiveRequests,
			"failed_requests":    server.Stats.FailedRequests,
			"last_response_time": server.Stats.LastResponseTime,
			"is_active":          server.IsActive,
		}
		server.Stats.mu.RUnlock()
		stats[server.ID] = serverStats
	}
	return stats
}
