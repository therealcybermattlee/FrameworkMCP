#!/bin/bash

echo "🔍 Framework MCP Documentation Validation"
echo "========================================"
echo

# Every failed check must increment FAILURES and the script must exit non-zero.
# (A previous version printed an unconditional "Ready for Release!" summary
# regardless of what failed -- do not reintroduce that.)
FAILURES=0
pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAILURES=$((FAILURES + 1)); }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the Framework MCP root directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
if ! npm run build; then
    echo "❌ Build failed"
    exit 1
fi
pass "Build successful"
echo

# Test HTTP server startup
echo "🚀 Testing HTTP server startup..."
PORT=9004 node dist/interfaces/http/http-server.js &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:9004/health 2>/dev/null)
if echo "$HEALTH" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    pass "Health endpoint working (version: $(echo "$HEALTH" | jq -r '.version'))"
else
    echo "❌ Health endpoint failed -- cannot continue"
    exit 1
fi

# Test all API endpoints
echo
echo "🔧 Testing API endpoints..."

SAFEGUARDS=$(curl -s http://localhost:9004/api/safeguards 2>/dev/null)
TOTAL=$(echo "$SAFEGUARDS" | jq -r '.total' 2>/dev/null)
if [ "$TOTAL" = "153" ]; then
    pass "Safeguards endpoint: $TOTAL safeguards"
else
    fail "Safeguards endpoint failed (expected 153, got $TOTAL)"
fi

DETAILS=$(curl -s http://localhost:9004/api/safeguards/1.1 2>/dev/null)
TITLE=$(echo "$DETAILS" | jq -r '.title' 2>/dev/null)
if [[ "$TITLE" == "Establish and Maintain"* ]]; then
    pass "Safeguard details endpoint working"
else
    fail "Safeguard details endpoint failed"
fi

# Regression guard: the analysis endpoints were removed at v1.4.0 (Pure Data
# Provider architecture). They must stay gone -- assert they 404.
for DEAD_ROUTE in /api/validate-vendor-mapping /api/analyze-vendor-response /api/validate-coverage-claim; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:9004${DEAD_ROUTE}" 2>/dev/null)
    if [ "$CODE" = "404" ]; then
        pass "Removed endpoint ${DEAD_ROUTE} correctly returns 404"
    else
        fail "Removed endpoint ${DEAD_ROUTE} is reachable (HTTP ${CODE})"
    fi
done

kill $SERVER_PID 2>/dev/null
echo

# Documentation consistency checks
echo "📚 Checking documentation consistency..."

# The server exposes exactly two MCP tools. README must document both.
for TOOL in get_safeguard_details list_available_safeguards; do
    if grep -q "$TOOL" README.md; then
        pass "README documents $TOOL"
    else
        fail "README is missing $TOOL"
    fi
done

# Regression guard: the retired capability-role taxonomy (FULL / PARTIAL /
# FACILITATES / GOVERNANCE / VALIDATES) must not creep back. Note that
# 'governanceElements' (CIS orange elements) and securityFunction 'Govern' are
# authentic CIS data and are intentionally NOT matched here.
if grep -riE '\b(facilitates|validates)\b|capability role|5 capability' README.md > /dev/null 2>&1; then
    fail "Retired capability-role taxonomy found in README.md:"
    grep -rinE '\b(facilitates|validates)\b|capability role|5 capability' README.md
else
    pass "No retired capability-role taxonomy in README.md"
fi

# Check version consistency. The version is DERIVED from package.json -- never
# hardcode it here, or this check silently rots at the last release's number.
EXPECTED_VERSION=$(jq -r '.version' package.json)
echo "   Expected version (from package.json): $EXPECTED_VERSION"

VERSION_ISSUES=()
for file in "swagger.json" "src/interfaces/mcp/mcp-server.ts" "src/interfaces/http/http-server.ts"; do
    if [ -f "$file" ] && ! grep -q "$EXPECTED_VERSION" "$file"; then
        VERSION_ISSUES+=("$file")
    fi
done

if [ ${#VERSION_ISSUES[@]} -eq 0 ]; then
    pass "Version $EXPECTED_VERSION consistent across all files"
else
    fail "Version drift -- these files do not mention $EXPECTED_VERSION: ${VERSION_ISSUES[*]}"
fi

# Packaging guard. The `files` field in package.json is the only thing keeping
# dev tooling (.claude/, .github/, .specify/, .mcp.json) out of the published
# npm tarball -- without it, npm falls back to .gitignore and ships the whole
# repo. Assert the tarball stays clean and still contains its entry points.
echo
echo "📦 Checking npm tarball contents..."
PACK_FILES=$(npm pack --dry-run --json 2>/dev/null | jq -r '.[0].files[].path')

if echo "$PACK_FILES" | grep -qE '^\.|specify|claude|github|^\.do/'; then
    fail "Dev config would be published to npm (check the \"files\" field in package.json):"
    echo "$PACK_FILES" | grep -E '^\.|specify|claude|github|^\.do/' | sed 's/^/     /'
else
    pass "npm tarball contains no dev config ($(echo "$PACK_FILES" | wc -l | tr -d ' ') files)"
fi

for ENTRY in "dist/index.js" "dist/interfaces/http/http-server.js"; do
    if echo "$PACK_FILES" | grep -qx "$ENTRY"; then
        pass "npm tarball contains $ENTRY"
    else
        fail "npm tarball is MISSING entry point $ENTRY"
    fi
done

# Summary
echo
echo "📊 VALIDATION SUMMARY"
echo "===================="
if [ "$FAILURES" -eq 0 ]; then
    echo "🎉 Framework MCP v${EXPECTED_VERSION}: all checks passed"
    exit 0
else
    echo "❌ Framework MCP v${EXPECTED_VERSION}: ${FAILURES} check(s) failed -- see above"
    exit 1
fi
