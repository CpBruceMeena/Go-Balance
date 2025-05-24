package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/CpBruceMeena/go-balance/internal/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// Get the executable path
	ex, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	exPath := filepath.Dir(ex)

	// Construct the path to the frontend build directory
	frontendPath := filepath.Join(exPath, "..", "frontend", "build")

	// Create a new router
	router := mux.NewRouter()

	// Register API routes
	handlers.RegisterClusterRoutes(router)

	// Serve static files from the frontend build directory
	fs := http.FileServer(http.Dir(frontendPath))
	router.PathPrefix("/").Handler(fs)

	// Start the server
	log.Printf("Server starting on :8080, serving files from %s", frontendPath)
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatal(err)
	}
}
