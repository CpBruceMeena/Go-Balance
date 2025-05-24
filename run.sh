#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_url() {
    echo -e "\n${BOLD}${BLUE}=================================================${NC}"
    echo -e "${BOLD}${BLUE}           APPLICATION IS RUNNING!              ${NC}"
    echo -e "${BOLD}${BLUE}=================================================${NC}"
    echo -e "${BOLD}${GREEN}Open your browser and navigate to:${NC}"
    echo -e "${BOLD}${YELLOW}http://localhost:8080${NC}"
    echo -e "${BOLD}${BLUE}=================================================${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Go version
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.21 or higher."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Installing Go..."
            sudo apt update && sudo apt install -y golang
        else
            echo "Please install Go manually: https://golang.org/dl/"
            exit 1
        fi
    fi

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Installing Node.js..."
            sudo apt update && sudo apt install -y nodejs npm
        else
            echo "Please install Node.js manually: https://nodejs.org/"
            exit 1
        fi
    fi

    # Check npm version
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm 9 or higher."
        exit 1
    fi

    print_status "All prerequisites are satisfied."
}

# Build backend
build_backend() {
    print_status "Building backend..."
    
    cd backend || exit 1
    
    # Download dependencies
    go mod download
    
    # Build the application
    go build -o go-balance cmd/main.go
    
    if [ $? -eq 0 ]; then
        print_status "Backend built successfully."
    else
        print_error "Failed to build backend."
        exit 1
    fi
    
    cd ..
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend || exit 1
    
    # Install dependencies
    npm install
    
    # Build the application
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Frontend built successfully."
    else
        print_error "Failed to build frontend."
        exit 1
    fi
    
    cd ..
}

# Start the application
start_application() {
    print_status "Starting application..."
    
    # Start backend
    cd backend || exit 1
    ./go-balance &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 2
    
    # Print the URL in a prominent way
    print_url
    
    # Try to open web interface in default browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8080
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8080
    elif [[ "$OSTYPE" == "msys" ]]; then
        start http://localhost:8080
    fi
    
    print_status "Press Ctrl+C to stop the application."
    
    # Wait for user to press Ctrl+C
    wait $BACKEND_PID
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Starting Go-Balance setup..."
    
    # Check prerequisites
    check_prerequisites
    
    # Build backend
    build_backend
    
    # Build frontend
    build_frontend
    
    # Start application
    start_application
}

# Run main function
main 