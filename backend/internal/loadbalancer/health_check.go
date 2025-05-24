package loadbalancer

import (
	"net/http"
	"time"
)

// HealthChecker represents a health check manager
type HealthChecker struct {
	client *http.Client
}

// NewHealthChecker creates a new health checker instance
func NewHealthChecker() *HealthChecker {
	return &HealthChecker{
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// CheckServerHealth performs a health check on a server
func (hc *HealthChecker) CheckServerHealth(server *Server) bool {
	if server.HealthCheck == nil {
		return true
	}

	url := server.URL + server.HealthCheck.Path
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false
	}

	resp, err := hc.client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 200 && resp.StatusCode < 300
}

// StartHealthChecks starts periodic health checks for a server
func (hc *HealthChecker) StartHealthChecks(server *Server) {
	if server.HealthCheck == nil {
		return
	}

	ticker := time.NewTicker(server.HealthCheck.Interval)
	go func() {
		consecutiveFailures := 0
		consecutiveSuccesses := 0

		for range ticker.C {
			isHealthy := hc.CheckServerHealth(server)

			server.mu.Lock()
			if isHealthy {
				consecutiveSuccesses++
				consecutiveFailures = 0
				if consecutiveSuccesses >= server.HealthCheck.HealthyThreshold {
					server.IsActive = true
				}
			} else {
				consecutiveFailures++
				consecutiveSuccesses = 0
				if consecutiveFailures >= server.HealthCheck.UnhealthyThreshold {
					server.IsActive = false
				}
			}
			server.mu.Unlock()
		}
	}()
}
