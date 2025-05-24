# Go-Balance

A modern, scalable load balancer built in Go with a React.js web interface. This project provides a powerful load balancing solution with features like multiple load balancing algorithms, rate limiting, health checks, and a user-friendly web interface for configuration and monitoring.

## Features

- Multiple load balancing algorithms (Round Robin, Least Connections, Weighted Round Robin, IP Hash)
- Cluster management with isolated configurations
- Rate limiting with customizable rules
- Health checks and automatic failover
- SSL/TLS termination
- Real-time monitoring and metrics
- Modern React.js web interface with TypeScript
- Comprehensive logging and alerting
- Full-screen cluster management widget for improved usability
- Node list displayed in a responsive, tabular format for better readability

## Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- npm 9 or higher
- Docker (optional)
- Make (optional)

## Project Structure

```
.
├── backend/           # Go backend application
│   ├── cmd/          # Application entry points
│   ├── internal/     # Private application code
│   ├── pkg/          # Public library code
│   └── api/          # API definitions
├── frontend/         # React.js frontend application
│   ├── src/         # Source code
│   ├── public/      # Static files
│   └── package.json # Dependencies
├── scripts/         # Build and deployment scripts
├── docs/           # Documentation
├── run.sh          # Main execution script
└── README.md       # This file
```

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/CpBruceMeena/Go-Balance.git
   cd Go-Balance
   ```

2. Run the application:
   ```bash
   ./run.sh
   ```

This will:
- Build the Go backend
- Build the React frontend
- Start the application
- Open the web interface in your default browser at http://localhost:8080

## Development

### Backend Development

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the development server:
   ```bash
   go run cmd/main.go
   ```

### Frontend Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Building

### Build Backend
```bash
cd backend
go build -o go-balance cmd/main.go
```

### Build Frontend
```bash
cd frontend
npm run build
```

## Testing

### Backend Tests
```bash
cd backend
go test ./...
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Docker Support

Build and run using Docker:
```bash
docker build -t go-balance .
docker run -p 8080:8080 go-balance
```

## Configuration

The application can be configured using:
- Environment variables
- Configuration files (YAML/JSON)
- Command-line flags

See `docs/configuration.md` for detailed configuration options.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Go](https://golang.org/)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Chart.js](https://www.chartjs.org/)

## UI Improvements

### June 2024

- The cluster management widget is now full screen, making it easier to view and manage clusters and nodes.
- Node lists are displayed in a table format, ensuring all node data is visible in a single row without horizontal scrolling.
- Improved padding and layout for a more modern, user-friendly experience.
