#!/bin/bash

# Production iOS build script
echo "Starting production iOS build..."

# Use expect to handle interactive prompts
expect << 'EOF'
spawn eas build --platform ios --profile production
expect "Do you want to log in to your Apple account?" { send "yes\r" }
expect "Apple ID:" { send "sondre@stavhopp.no\r" }
expect "Reuse this distribution certificate?" { send "yes\r" }
expect "Generate a new Apple Provisioning Profile?" { send "yes\r" }
expect eof
EOF
