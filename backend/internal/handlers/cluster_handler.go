package handlers

import (
	"encoding/json"
	"net/http"
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
}

type ClusterManager struct {
	clusters map[string]*Cluster
	mu       sync.RWMutex
}

var clusterManager = &ClusterManager{
	clusters: make(map[string]*Cluster),
}

type AddNodeRequest struct {
	URL string `json:"url"`
}

type CreateClusterRequest struct {
	Name                 string `json:"name"`
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"` // Frequency in seconds
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

func (cm *ClusterManager) CreateCluster(w http.ResponseWriter, r *http.Request) {
	var request CreateClusterRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cluster := &Cluster{
		ID:                   time.Now().Format("20060102150405"),
		Name:                 request.Name,
		Nodes:                make([]Node, 0),
		Algorithm:            "round-robin",
		HealthCheckEndpoint:  request.HealthCheckEndpoint,
		HealthCheckFrequency: request.HealthCheckFrequency,
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
	resp, err := http.Get(nodeURL + healthCheckEndpoint)
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
	ticker := time.NewTicker(time.Duration(frequency) * time.Second)
	defer ticker.Stop()

	// Perform initial health check
	healthStatus, _ := cm.checkNodeHealth(nodeURL, healthCheckEndpoint)
	cm.updateNodeHealthStatus(clusterID, nodeID, healthStatus)

	for range ticker.C {
		healthStatus, _ := cm.checkNodeHealth(nodeURL, healthCheckEndpoint)
		cm.updateNodeHealthStatus(clusterID, nodeID, healthStatus)
	}
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

func RegisterClusterRoutes(router *mux.Router) {
	router.HandleFunc("/api/clusters", clusterManager.GetClusters).Methods("GET")
	router.HandleFunc("/api/clusters", clusterManager.CreateCluster).Methods("POST")
	router.HandleFunc("/api/clusters/{clusterId}", clusterManager.DeleteCluster).Methods("DELETE")
	router.HandleFunc("/api/clusters/{clusterId}/nodes", clusterManager.AddNode).Methods("POST")
	router.HandleFunc("/api/clusters/{clusterId}/nodes/{nodeId}", clusterManager.DeleteNode).Methods("DELETE")
	router.HandleFunc("/api/clusters/{clusterId}/nodes/{nodeId}/health", clusterManager.CheckNodeHealth).Methods("GET")
	router.HandleFunc("/api/clusters/{clusterId}/algorithm", clusterManager.UpdateAlgorithm).Methods("PUT")
}
