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

install_on_linux() {
    if command -v apt-get &> /dev/null; then
        if command -v sudo &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y "$@"
        else
            apt-get update
            apt-get install -y "$@"
        fi
    elif command -v yum &> /dev/null; then
        if command -v sudo &> /dev/null; then
            sudo yum install -y "$@"
        else
            yum install -y "$@"
        fi
    elif command -v pacman &> /dev/null; then
        if command -v sudo &> /dev/null; then
            sudo pacman -Sy --noconfirm "$@"
        else
            pacman -Sy --noconfirm "$@"
        fi
    else
        print_error "No supported package manager found. Please install dependencies manually."
        exit 1
    fi
}

install_on_mac() {
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew not found. Please install Homebrew: https://brew.sh/"
        exit 1
    fi
    brew install "$@"
}

install_on_windows() {
    if ! command -v choco &> /dev/null; then
        print_error "Chocolatey not found. Please install Chocolatey: https://chocolatey.org/install"
        exit 1
    fi
    choco install -y "$@"
}

check_and_install() {
    local cmd=$1
    local pkg=$2
    if ! command -v $cmd &> /dev/null; then
        print_warning "$cmd is not installed."
        case "$OSTYPE" in
            linux-gnu*) install_on_linux "$pkg" ;;
            darwin*) install_on_mac "$pkg" ;;
            msys*) install_on_windows "$pkg" ;;
            *) print_error "Unsupported OS. Please install $pkg manually."; exit 1 ;;
        esac
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    check_and_install go golang
    check_and_install node nodejs
    check_and_install npm npm

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
        xdg-open http://localhost:8080 || true
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