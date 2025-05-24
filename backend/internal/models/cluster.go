package models

import "time"

type Node struct {
	ID           string    `json:"id"`
	URL          string    `json:"url"`
	IsActive     bool      `json:"isActive"`
	HealthStatus string    `json:"healthStatus"`
	LastChecked  time.Time `json:"lastChecked"`
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
}

type CreateClusterRequest struct {
	Name                 string `json:"name"`
	Algorithm            string `json:"algorithm"`
	HealthCheckEndpoint  string `json:"healthCheckEndpoint"`
	HealthCheckFrequency int    `json:"healthCheckFrequency"` // Frequency in seconds
}
