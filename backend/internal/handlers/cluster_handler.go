package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type Node struct {
	ID           string    `json:"id"`
	URL          string    `json:"url"`
	IsActive     bool      `json:"isActive"`
	HealthStatus string    `json:"healthStatus"`
	LastChecked  time.Time `json:"lastChecked"`
}

const (
	HealthCheckEndpoint = "/health"
)

type Cluster struct {
	ID                   string `json:"id"`
	Name                 string `json:"name"`
	Nodes                []Node `json:"nodes"`
	Algorithm            string `json:"algorithm"`
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"` // Frequency in seconds
	PublicEndpoint       string `json:"publicEndpoint"`
}

type ClusterManager struct {
	clusters map[string]*Cluster
	mu       sync.RWMutex
	// Map to track active health check goroutines
	healthCheckStops map[string]chan struct{}
}

var clusterManager = &ClusterManager{
	clusters:         make(map[string]*Cluster),
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

	clusters := make([]*Cluster, 0, len(cm.clusters))
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

	cluster := &Cluster{
		ID:                   time.Now().Format("20060102150405"),
		Name:                 request.Name,
		Nodes:                make([]Node, 0),
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

	node := &Node{
		ID:          uuid.New().String(),
		URL:         request.URL,
		IsActive:    true,
		LastChecked: time.Now(),
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

	var targetNode *Node
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
	nodes := make([]Node, len(cluster.Nodes))
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

	cm.mu.RLock()
	var targetCluster *Cluster
	for _, cluster := range cm.clusters {
		if slugify(cluster.Name) == clusterSlug {
			targetCluster = cluster
			break
		}
	}
	cm.mu.RUnlock()

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
	for _, node := range targetCluster.Nodes {
		if node.IsActive {
			nodeURL = node.URL
			break
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
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Failed to reach node", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

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
