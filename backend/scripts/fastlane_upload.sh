#!/bin/bash

# Fastlane Automation Wrapper Script
# Usage: ./fastlane_upload.sh <platform> <binary_path> <version> <db_id> <app_identifier>

PLATFORM=$1
BINARY_PATH=$2
VERSION=$3
DB_ID=$4
APP_IDENTIFIER=$5

# Backend API for status updates
API_URL="http://localhost:8000/api/apps.php"

update_status() {
    local status=$1
    local msg=$2
    # Simple curl to update status back in DB
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "cmd=update_status&id=$DB_ID&status=$status&message=$msg"
}

echo "--- Fastlane Session Started: $(date) ---"
echo "Platform: $PLATFORM"
echo "Binary: $BINARY_PATH"
echo "Version: $VERSION"
echo "App Identifier: $APP_IDENTIFIER"

# Navigate to the fastlane directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FASTLANE_DIR="$SCRIPT_DIR/../../fastlane"

cd "$FASTLANE_DIR" || { echo "Fastlane directory not found"; exit 1; }

# Load .env variables if file exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
fi

# Export the dynamic identifier for Fastlane to use overriding Appfile
export FASTLANE_APP_IDENTIFIER="$APP_IDENTIFIER"

# Execute official Fastlane command
if [ "$PLATFORM" == "android" ]; then
    # Ensure binary path is relative to current fastlane dir
    # Note: BINARY_PATH is typically ../storage/apps/filename.apk relative to backend/api
    # So from fastlane dir, it would be ../storage/apps/filename.apk
    fastlane android_upload apk:"../$BINARY_PATH"
elif [ "$PLATFORM" == "ios" ]; then
    fastlane ios_upload ipa:"../$BINARY_PATH"
else
    echo "Unsupported platform: $PLATFORM"
    update_status "failed" "Unsupported platform"
    exit 1
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo "Fastlane Task Completed Successfully."
    update_status "success" "Uploaded v$VERSION to Store"
else
    echo "Fastlane Task Failed."
    update_status "failed" "Fastlane error. Check logs on server."
fi
