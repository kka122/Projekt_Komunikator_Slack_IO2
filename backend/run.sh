#!/bin/bash

# Array to store PIDs of all Python processes
PIDS=()

# Function to kill all Python processes
cleanup() {
    echo ""
    echo "Stopping all Python processes..."

    # Kill all stored PIDs
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Killing process $pid"
            kill -TERM "$pid" 2>/dev/null
        fi
    done

    # Wait a bit for graceful shutdown
    sleep 1

    # Force kill if still running
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Force killing process $pid"
            kill -9 "$pid" 2>/dev/null
        fi
    done

    echo "All Python processes stopped."
    exit 0
}

# Trap Ctrl+C (SIGINT) and call cleanup function
trap cleanup SIGINT SIGTERM

if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "Starting backend services..."

# Start main backend process
python main.py &
PIDS+=($!)
echo "Started main.py with PID $!"

# Start python workers processes
python workspace_consumer.py &
PIDS+=($!)
echo "Started workspace_consumer.py with PID $!"

echo ""
echo "All services running. Press Ctrl+C to stop all processes."
echo ""

# Wait for all background processes
wait