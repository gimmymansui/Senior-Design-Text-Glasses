#!/bin/bash

# Set environment variables
export PATH="/home/radxa/.nvm/versions/node/v22.14.0/bin:$PATH"
export NODE_PATH="/home/radxa/.nvm/versions/node/v22.14.0/lib/node_modules"
export NVM_DIR="/home/radxa/.nvm"

# Navigate to the project directory
cd ~/Documents/Github/Senior-Design-Text-Glasses/apps/pwa/src/glasses-display || exit 1

# Run the WebSocket server
/home/radxa/.nvm/versions/node/v22.14.0/bin/npm run websocket &
/home/radxa/.nvm/versions/node/v22.14.0/bin/npm run dev &

# Set up Python environment
cd /home/radxa/Documents/
# Instead of using source (which may not be available in cron's shell)
export VIRTUAL_ENV="/home/radxa/Documents/venv"
export PATH="$VIRTUAL_ENV/bin:$PATH"
# Use the Python executable from the virtual environment
$VIRTUAL_ENV/bin/python /home/radxa/Documents/Github/Senior-Design-Text-Glasses/ml-service/src/vosk_speech_model.py
