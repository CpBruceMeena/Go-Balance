package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

type Node struct {
	ID           string    `json:"id"`
	URL          string    `json:"url"`
	IsActive     bool      `json:"isActive"`
	HealthStatus string    `json:"healthStatus"`
	LastChecked  time.Time `json:"lastChecked"`
}

type Cluster struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Nodes     []Node `json:"nodes"`
	Algorithm string `json:"algorithm"`
}

type ClusterManager struct {
	clusters map[string]*Cluster
	mu       sync.RWMutex
}

var clusterManager = &ClusterManager{
	clusters: make(map[string]*Cluster),
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
	var request struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cluster := &Cluster{
		ID:        time.Now().Format("20060102150405"),
		Name:      request.Name,
		Nodes:     make([]Node, 0),
		Algorithm: "round-robin",
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

	node := Node{
		ID:           time.Now().Format("20060102150405"),
		URL:          request.URL,
		IsActive:     true,
		HealthStatus: "unknown",
		LastChecked:  time.Now(),
	}

	cluster.Nodes = append(cluster.Nodes, node)
	cm.mu.Unlock()

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
			// TODO: Implement actual health check
			cluster.Nodes[i].LastChecked = time.Now()
			cluster.Nodes[i].HealthStatus = "healthy" // This should be determined by actual health check
			cm.mu.Unlock()

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cluster.Nodes[i])
			return
		}
	}
	cm.mu.Unlock()

	http.Error(w, "Node not found", http.StatusNotFound)
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
