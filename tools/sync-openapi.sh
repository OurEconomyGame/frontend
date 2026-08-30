#!/usr/bin/env bash
set -euo pipefail

# URL to raw openapi.json in OurEconomyGame/server repository
SERVER_OPENAPI_URL="https://raw.githubusercontent.com/OurEconomyGame/server/main/openapi.json"
TARGET_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/openapi.json"

echo "Fetching latest openapi.json from ${SERVER_OPENAPI_URL}..."
curl -sSL "${SERVER_OPENAPI_URL}" -o "${TARGET_FILE}"

echo "Successfully synchronized openapi.json to ${TARGET_FILE}"
