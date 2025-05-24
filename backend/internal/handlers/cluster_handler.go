package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/CpBruceMeena/go-balance/internal/models"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

const (
	HealthCheckEndpoint = "/health"
)

type ClusterManager struct {
	clusters map[string]*models.Cluster
	mu       sync.RWMutex
	// Map to track active health check goroutines
	healthCheckStops map[string]chan struct{}
}

var clusterManager = &ClusterManager{
	clusters:         make(map[string]*models.Cluster),
	healthCheckStops: make(map[string]chan struct{}),
}

type AddNodeRequest struct {
	URL string `json:"url"`
}

type CreateClusterRequest struct {
	Name                 string `json:"name"`
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"` // Frequency in seconds
}

type UpdateClusterRequest struct {
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"`
}

func (cm *ClusterManager) GetClusters(w http.ResponseWriter, r *http.Request) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	clusters := make([]*models.Cluster, 0, len(cm.clusters))
	for _, cluster := range cm.clusters {
		clusters = append(clusters, cluster)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clusters)
}

func slugify(name string) string {
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, " ", "-")
	name = strings.ReplaceAll(name, "_", "-")
	return name
}

func (cm *ClusterManager) CreateCluster(w http.ResponseWriter, r *http.Request) {
	var request CreateClusterRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate health check frequency
	if request.HealthCheckFrequency <= 0 {
		http.Error(w, "Health check frequency must be a positive number", http.StatusBadRequest)
		return
	}

	clusterNameSlug := slugify(request.Name)
	publicEndpoint := "/api/proxy/" + clusterNameSlug

	cluster := &models.Cluster{
		ID:                   time.Now().Format("20060102150405"),
		Name:                 request.Name,
		Nodes:                make([]models.Node, 0),
		Algorithm:            "round-robin",
		HealthCheckEndpoint:  request.HealthCheckEndpoint,
		HealthCheckFrequency: request.HealthCheckFrequency,
		PublicEndpoint:       publicEndpoint,
	}

	cm.mu.Lock()
	cm.clusters[cluster.ID] = cluster
	cm.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cluster)
}

func (cm *ClusterManager) DeleteCluster(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterID := vars["clusterId"]

	cm.mu.Lock()
	delete(cm.clusters, clusterID)
	cm.mu.Unlock()

	w.WriteHeader(http.StatusNoContent)
}

func (cm *ClusterManager) checkNodeHealth(nodeURL, healthCheckEndpoint string) (string, error) {
	// Ensure URL is properly formatted
	if !strings.HasPrefix(nodeURL, "http://") && !strings.HasPrefix(nodeURL, "https://") {
		nodeURL = "http://" + nodeURL
	}

	// Ensure health check endpoint starts with /
	if !strings.HasPrefix(healthCheckEndpoint, "/") {
		healthCheckEndpoint = "/" + healthCheckEndpoint
	}

	fullURL := nodeURL + healthCheckEndpoint
	resp, err := http.Get(fullURL)
	if err != nil {
		return "unhealthy", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return "healthy", nil
	}
	return "unhealthy", nil
}

func (cm *ClusterManager) startNodeHealthCheck(clusterID, nodeID, nodeURL, healthCheckEndpoint string, frequency int) {
	if frequency <= 0 {
		return
	}
	stopChan := make(chan struct{})
	stopKey := fmt.Sprintf("%s-%s", clusterID, nodeID)

	// Store the stop channel
	cm.mu.Lock()
	// If there's an existing health check, stop it first
	if existingStop, exists := cm.healthCheckStops[stopKey]; exists {
		close(existingStop)
	}
	cm.healthCheckStops[stopKey] = stopChan
	cm.mu.Unlock()

	ticker := time.NewTicker(time.Duration(frequency) * time.Second)
	defer ticker.Stop()

	// Perform initial health check
	healthStatus, _ := cm.checkNodeHealth(nodeURL, healthCheckEndpoint)
	cm.updateNodeHealthStatus(clusterID, nodeID, healthStatus)

	for {
		select {
		case <-ticker.C:
			healthStatus, err := cm.checkNodeHealth(nodeURL, healthCheckEndpoint)
			if err != nil {
				healthStatus = "unhealthy"
			}
			cm.updateNodeHealthStatus(clusterID, nodeID, healthStatus)
		case <-stopChan:
			return
		}
	}
}

func (cm *ClusterManager) stopNodeHealthCheck(clusterID, nodeID string) {
	stopKey := fmt.Sprintf("%s-%s", clusterID, nodeID)
	cm.mu.Lock()
	if stopChan, exists := cm.healthCheckStops[stopKey]; exists {
		close(stopChan)
		delete(cm.healthCheckStops, stopKey)
	}
	cm.mu.Unlock()
}

func (cm *ClusterManager) updateNodeHealthStatus(clusterID, nodeID, healthStatus string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	cluster, exists := cm.clusters[clusterID]
	if !exists {
		return
	}

	for i, node := range cluster.Nodes {
		if node.ID == nodeID {
			cluster.Nodes[i].HealthStatus = healthStatus
			cluster.Nodes[i].LastChecked = time.Now()
			cluster.Nodes[i].IsActive = healthStatus == "healthy"
			cm.clusters[clusterID] = cluster
			break
		}
	}
}

func (cm *ClusterManager) AddNode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterID := vars["clusterId"]

	var request struct {
		URL string `json:"url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Trim whitespace from the node URL
	request.URL = strings.TrimSpace(request.URL)

	cm.mu.Lock()
	cluster, exists := cm.clusters[clusterID]
	if !exists {
		cm.mu.Unlock()
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	node := &models.Node{
		ID:                uuid.New().String(),
		URL:               request.URL,
		IsActive:          true,
		LastChecked:       time.Now(),
		CreatedAt:         time.Now(),
		Weight:            1,
		ResponseTime:      0,
		TotalRequests:     0,
		RequestsPerSec:    0,
		LastRequest:       time.Time{},
		RequestTimestamps: []time.Time{},
	}

	// Perform immediate health check
	healthStatus, err := cm.checkNodeHealth(node.URL, cluster.HealthCheckEndpoint)
	if err != nil {
		healthStatus = "unhealthy"
	}
	node.HealthStatus = healthStatus
	node.IsActive = healthStatus == "healthy"

	cluster.Nodes = append(cluster.Nodes, *node)
	cm.clusters[clusterID] = cluster
	cm.mu.Unlock()

	// Start periodic health check for this node
	go cm.startNodeHealthCheck(clusterID, node.ID, node.URL, cluster.HealthCheckEndpoint, cluster.HealthCheckFrequency)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(node)
}

func (cm *ClusterManager) DeleteNode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterID := vars["clusterId"]
	nodeID := vars["nodeId"]

	cm.mu.Lock()
	cluster, exists := cm.clusters[clusterID]
	if !exists {
		cm.mu.Unlock()
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	for i, node := range cluster.Nodes {
		if node.ID == nodeID {
			cluster.Nodes = append(cluster.Nodes[:i], cluster.Nodes[i+1:]...)
			cm.mu.Unlock()
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}
	cm.mu.Unlock()

	http.Error(w, "Node not found", http.StatusNotFound)
}

func (cm *ClusterManager) CheckNodeHealth(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterId := vars["clusterId"]
	nodeId := vars["nodeId"]

	cm.mu.Lock()
	defer cm.mu.Unlock()

	cluster, exists := cm.clusters[clusterId]
	if !exists {
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	var targetNode *models.Node
	for i, node := range cluster.Nodes {
		if node.ID == nodeId {
			targetNode = &cluster.Nodes[i]
			break
		}
	}

	if targetNode == nil {
		http.Error(w, "Node not found", http.StatusNotFound)
		return
	}

	// Perform health check using the cluster's health check endpoint
	healthCheckUrl := targetNode.URL + cluster.HealthCheckEndpoint
	resp, err := http.Get(healthCheckUrl)
	if err != nil {
		targetNode.HealthStatus = "unhealthy"
		targetNode.LastChecked = time.Now()
		json.NewEncoder(w).Encode(targetNode)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		targetNode.HealthStatus = "healthy"
	} else {
		targetNode.HealthStatus = "unhealthy"
	}
	targetNode.LastChecked = time.Now()

	json.NewEncoder(w).Encode(targetNode)
}

func (cm *ClusterManager) UpdateAlgorithm(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterID := vars["clusterId"]

	var request struct {
		Algorithm string `json:"algorithm"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cm.mu.Lock()
	cluster, exists := cm.clusters[clusterID]
	if !exists {
		cm.mu.Unlock()
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	cluster.Algorithm = request.Algorithm
	cm.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cluster)
}

func (cm *ClusterManager) UpdateCluster(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterID := vars["clusterId"]

	var request UpdateClusterRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate health check frequency
	if request.HealthCheckFrequency <= 0 {
		http.Error(w, "Health check frequency must be a positive number", http.StatusBadRequest)
		return
	}

	cm.mu.Lock()
	cluster, exists := cm.clusters[clusterID]
	if !exists {
		cm.mu.Unlock()
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	// Create a copy of nodes to avoid holding the lock while stopping health checks
	nodes := make([]models.Node, len(cluster.Nodes))
	copy(nodes, cluster.Nodes)

	// Update cluster configuration
	cluster.HealthCheckEndpoint = request.HealthCheckEndpoint
	cluster.HealthCheckFrequency = request.HealthCheckFrequency
	cm.clusters[clusterID] = cluster
	cm.mu.Unlock()

	// Stop existing health checks (outside the lock)
	for _, node := range nodes {
		cm.stopNodeHealthCheck(clusterID, node.ID)
	}

	// Start new health checks with updated configuration
	for _, node := range nodes {
		go cm.startNodeHealthCheck(clusterID, node.ID, node.URL, cluster.HealthCheckEndpoint, cluster.HealthCheckFrequency)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cluster)
}

// Add a proxy handler
func (cm *ClusterManager) ProxyToCluster(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	clusterSlug := vars["clusterSlug"]
	rest := vars["rest"]

	var targetCluster *models.Cluster
	for _, cluster := range cm.clusters {
		if slugify(cluster.Name) == clusterSlug {
			targetCluster = cluster
			break
		}
	}

	if targetCluster == nil {
		http.Error(w, "Cluster not found", http.StatusNotFound)
		return
	}

	if len(targetCluster.Nodes) == 0 {
		http.Error(w, "No nodes available in cluster", http.StatusServiceUnavailable)
		return
	}

	// Simple round-robin: pick the next active node
	var nodeURL string
	var nodeIdx int

	switch targetCluster.Algorithm {
	case "round-robin":
		// Find the next active node after the last used one
		startIdx := 0
		if len(targetCluster.Nodes) > 0 {
			startIdx = (targetCluster.TotalRequests % len(targetCluster.Nodes))
		}
		for i := 0; i < len(targetCluster.Nodes); i++ {
			idx := (startIdx + i) % len(targetCluster.Nodes)
			if targetCluster.Nodes[idx].IsActive {
				nodeURL = targetCluster.Nodes[idx].URL
				nodeIdx = idx
				break
			}
		}
	case "least-connections":
		// Find the node with the least active connections
		minConnections := -1
		for i, node := range targetCluster.Nodes {
			if !node.IsActive {
				continue
			}
			if minConnections == -1 || node.TotalRequests < minConnections {
				minConnections = node.TotalRequests
				nodeURL = node.URL
				nodeIdx = i
			}
		}
	case "weighted-round-robin":
		// Find the node with the highest weight among active nodes
		maxWeight := -1
		for i, node := range targetCluster.Nodes {
			if !node.IsActive {
				continue
			}
			if node.Weight > maxWeight {
				maxWeight = node.Weight
				nodeURL = node.URL
				nodeIdx = i
			}
		}
	default:
		// Default to round-robin
		for i, node := range targetCluster.Nodes {
			if node.IsActive {
				nodeURL = node.URL
				nodeIdx = i
				break
			}
		}
	}

	if nodeURL == "" {
		http.Error(w, "No active nodes available", http.StatusServiceUnavailable)
		return
	}

	// Proxy the request to the selected node
	forwardPath := "/" + rest
	if rest == "" {
		forwardPath = "/"
	}
	proxyURL := nodeURL + forwardPath
	if r.URL.RawQuery != "" {
		proxyURL += "?" + r.URL.RawQuery
	}

	proxyReq, err := http.NewRequest(r.Method, proxyURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}
	proxyReq.Header = r.Header

	client := &http.Client{}
	startTime := time.Now()
	resp, err := client.Do(proxyReq)
	responseDuration := time.Since(startTime).Seconds() * 1000 // ms
	if err != nil {
		http.Error(w, "Failed to reach node", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// --- Request tracking logic ---
	now := time.Now()
	cm.mu.Lock()
	// Node-level
	node := &targetCluster.Nodes[nodeIdx]
	node.TotalRequests++
	node.LastRequest = now
	node.RequestTimestamps = append(node.RequestTimestamps, now)
	// Remove timestamps older than 60s
	cutoff := now.Add(-60 * time.Second)
	newTimestamps := make([]time.Time, 0, len(node.RequestTimestamps))
	for _, t := range node.RequestTimestamps {
		if t.After(cutoff) {
			newTimestamps = append(newTimestamps, t)
		}
	}
	node.RequestTimestamps = newTimestamps
	node.RequestsPerSec = float64(len(newTimestamps)) / 60.0
	// Response time (simple moving average)
	if node.TotalRequests == 1 {
		node.ResponseTime = responseDuration
	} else {
		node.ResponseTime = (node.ResponseTime*float64(node.TotalRequests-1) + responseDuration) / float64(node.TotalRequests)
	}
	// Cluster-level
	targetCluster.TotalRequests++
	targetCluster.LastRequest = now
	targetCluster.RequestTimestamps = append(targetCluster.RequestTimestamps, now)
	newCTimestamps := make([]time.Time, 0, len(targetCluster.RequestTimestamps))
	for _, t := range targetCluster.RequestTimestamps {
		if t.After(cutoff) {
			newCTimestamps = append(newCTimestamps, t)
		}
	}
	targetCluster.RequestTimestamps = newCTimestamps
	targetCluster.RequestsPerSec = float64(len(newCTimestamps)) / 60.0
	cm.mu.Unlock()
	// --- End request tracking logic ---

	for k, v := range resp.Header {
		for _, vv := range v {
			w.Header().Add(k, vv)
		}
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func RegisterClusterRoutes(router *mux.Router) {
	router.HandleFunc("/api/clusters", clusterManager.GetClusters).Methods("GET")
	router.HandleFunc("/api/clusters", clusterManager.CreateCluster).Methods("POST")
	router.HandleFunc("/api/clusters/{clusterId}", clusterManager.DeleteCluster).Methods("DELETE")
	router.HandleFunc("/api/clusters/{clusterId}", clusterManager.UpdateCluster).Methods("PUT")
	router.HandleFunc("/api/clusters/{clusterId}/nodes", clusterManager.AddNode).Methods("POST")
	router.HandleFunc("/api/clusters/{clusterId}/nodes/{nodeId}", clusterManager.DeleteNode).Methods("DELETE")
	router.HandleFunc("/api/clusters/{clusterId}/nodes/{nodeId}/health", clusterManager.CheckNodeHealth).Methods("GET")
	router.HandleFunc("/api/clusters/{clusterId}/algorithm", clusterManager.UpdateAlgorithm).Methods("PUT")
	// Add the proxy route
	router.HandleFunc("/api/proxy/{clusterSlug}/{rest:.*}", clusterManager.ProxyToCluster)
}
