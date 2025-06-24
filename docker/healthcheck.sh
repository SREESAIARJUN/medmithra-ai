#!/bin/bash
# Health check script for multi-cloud deployment

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if backend is responding
if ! curl -f http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "Backend is not responding"
    exit 1
fi

# Check if frontend is serving files
if ! curl -f http://localhost:${PORT:-8080}/health > /dev/null 2>&1; then
    echo "Frontend is not responding"
    exit 1
fi

echo "All services are healthy"
exit 0