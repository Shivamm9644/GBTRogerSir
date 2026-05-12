#!/bin/bash

# Fastlane Automation Script for GBT Dashboard
# Usage: ./fastlane_upload.sh <artifact_id>

# 1. Environment Setup
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/home/$(whoami)/.gem/bin:/home/$(whoami)/.rbenv/shims

# Find fastlane absolute path
FASTLANE_CMD=$(which fastlane 2>/dev/null)
if [ -z "$FASTLANE_CMD" ]; then
    if [ -f "/usr/local/bin/fastlane" ]; then
        FASTLANE_CMD="/usr/local/bin/fastlane"
    elif [ -f "/usr/bin/fastlane" ]; then
        FASTLANE_CMD="/usr/bin/fastlane"
    else
        FASTLANE_CMD="fastlane" # Fallback to default
    fi
fi

# Determine the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
STORAGE_DIR="$PROJECT_ROOT/gbtbackend/storage/apps"

echo "Script Dir: $SCRIPT_DIR"
echo "Project Root: $PROJECT_ROOT"
echo "Storage Dir: $STORAGE_DIR"

ARTIFACT_ID=$1
API_URL="https://app6.lmh-ai.in/gbtbackend/api/apps.php"

if [ -z "$ARTIFACT_ID" ]; then
    echo "Error: No Artifact ID provided."
    exit 1
fi

echo "--- Starting Fastlane Automation for ID: $ARTIFACT_ID ---"

# 1. Fetch Artifact Details from API
# We'll query the DB directly via PHP. 
# We need to make sure the credentials match what's in apps.php.

DETAILS=$(php -r "
    \$db_host = 'localhost';
    \$db_name = 'lmhaiss_app4';
    \$db_user = 'lmhaiss_app4';
    \$db_pass = 'tedzZXe4EsSptezVsH7z';
    \$conn = new mysqli(\$db_host, \$db_user, \$db_pass, \$db_name);
    if (\$conn->connect_error) {
        echo json_encode(['error' => 'DB Connection failed']);
        exit(1);
    }
    \$res = \$conn->query('SELECT * FROM app_artifacts WHERE id = $ARTIFACT_ID');
    echo json_encode(\$res->fetch_assoc());
")

PLATFORM=$(echo $DETAILS | php -r "echo json_decode(file_get_contents('php://stdin'))->platform;")
FILE_NAME=$(echo $DETAILS | php -r "echo json_decode(file_get_contents('php://stdin'))->binary_file_name;")
PACKAGE_NAME=$(echo $DETAILS | php -r "echo json_decode(file_get_contents('php://stdin'))->package_name;")
TRACK=$(echo $DETAILS | php -r "echo json_decode(file_get_contents('php://stdin'))->release_track;")

ABS_PATH="$STORAGE_DIR/$FILE_NAME"

echo "Platform: $PLATFORM"
echo "Package: $PACKAGE_NAME"
echo "Track: $TRACK"
echo "File: $ABS_PATH"

if [ ! -f "$ABS_PATH" ]; then
    curl -X POST $API_URL -d "cmd=update_status&id=$ARTIFACT_ID&status=failed&message=Binary file not found on server."
    exit 1
fi

# 2. Export ENV variables for Fastlane
export FASTLANE_APP_IDENTIFIER="$PACKAGE_NAME"

# 3. Execute Fastlane
cd "$PROJECT_ROOT"

SUCCESS=0
if [ "$PLATFORM" == "Android" ]; then
    $FASTLANE_CMD android android_upload aab:"$ABS_PATH" track:"$TRACK" package_name:"$PACKAGE_NAME"
    SUCCESS=$?
elif [ "$PLATFORM" == "iOS" ]; then
    $FASTLANE_CMD ios ios_upload ipa:"$ABS_PATH"
    SUCCESS=$?
else
    curl -X POST $API_URL -d "cmd=update_status&id=$ARTIFACT_ID&status=failed&message=Unsupported platform: $PLATFORM"
    exit 1
fi

# 4. Report Result
if [ $SUCCESS -eq 0 ]; then
    curl -X POST $API_URL -d "cmd=update_status&id=$ARTIFACT_ID&status=success&message=Successfully uploaded to Store."
else
    curl -X POST $API_URL -d "cmd=update_status&id=$ARTIFACT_ID&status=failed&message=Fastlane execution failed. Check logs."
fi

echo "--- Automation Finished ---"
