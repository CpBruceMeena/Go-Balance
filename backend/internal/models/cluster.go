package models

import "time"

type Node struct {
	ID           string    `json:"id"`
	URL          string    `json:"url"`
	IsActive     bool      `json:"isActive"`
	HealthStatus string    `json:"healthStatus"`
	LastChecked  time.Time `json:"lastChecked"`
	ResponseTime float64   `json:"responseTime"`
	CreatedAt    time.Time `json:"createdAt"`
	Weight       int       `json:"weight"`
	// Request stats
	TotalRequests     int         `json:"totalRequests"`
	RequestsPerSec    float64     `json:"requestsPerSec"`
	LastRequest       time.Time   `json:"lastRequest"`
	RequestTimestamps []time.Time `json:"-"`
	Connections       int         `json:"connections"`
	ErrorRate         float64     `json:"errorRate"`
	CPU               float64     `json:"cpu"`
	Memory            float64     `json:"memory"`
}

type Cluster struct {
	ID                   string    `json:"id"`
	Name                 string    `json:"name"`
	Algorithm            string    `json:"algorithm"`
	Nodes                []Node    `json:"nodes"`
	HealthCheckEndpoint  string    `json:"healthCheckEndpoint"`
	HealthCheckFrequency int       `json:"healthCheckFrequency"` // Frequency in seconds
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
	PublicEndpoint       string    `json:"publicEndpoint"`
	// Request stats
	TotalRequests     int         `json:"totalRequests"`
	RequestsPerSec    float64     `json:"requestsPerSec"`
	LastRequest       time.Time   `json:"lastRequest"`
	RequestTimestamps []time.Time `json:"-"`
}

type CreateClusterRequest struct {
	Name                 string `json:"name"`
	Algorithm            string `json:"algorithm"`
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"` // Frequency in seconds
}
