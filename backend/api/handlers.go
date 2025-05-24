package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/CpBruceMeena/go-balance/internal/loadbalancer"
)

// Handler represents the API handler
type Handler struct {
	lb *loadbalancer.LoadBalancer
	hc *loadbalancer.HealthChecker
}

// NewHandler creates a new API handler
func NewHandler(lb *loadbalancer.LoadBalancer, hc *loadbalancer.HealthChecker) *Handler {
	return &Handler{
		lb: lb,
		hc: hc,
	}
}

// AddServerRequest represents the request to add a server
type AddServerRequest struct {
	URL    string `json:"url"`
	Weight int    `json:"weight"`
}

// AddServer adds a new server to the load balancer
func (h *Handler) AddServer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AddServerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	server := &loadbalancer.Server{
		ID:       time.Now().Format("20060102150405"),
		URL:      req.URL,
		Weight:   req.Weight,
		IsActive: true,
		Stats:    &loadbalancer.ServerStats{},
		HealthCheck: &loadbalancer.HealthCheck{
			Path:               "/health",
			Interval:           30 * time.Second,
			Timeout:            5 * time.Second,
			HealthyThreshold:   2,
			UnhealthyThreshold: 3,
		},
	}

	h.lb.AddServer(server)
	h.hc.StartHealthChecks(server)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"id": server.ID,
	})
}

// RemoveServer removes a server from the load balancer
func (h *Handler) RemoveServer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	serverID := r.URL.Query().Get("id")
	if serverID == "" {
		http.Error(w, "Server ID is required", http.StatusBadRequest)
		return
	}

	h.lb.RemoveServer(serverID)
	w.WriteHeader(http.StatusOK)
}

// GetStats returns the load balancer statistics
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := h.lb.GetServerStats()
	json.NewEncoder(w).Encode(stats)
}

// HealthCheck returns the health check status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
