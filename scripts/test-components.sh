#!/bin/bash

# BadUI Component Test Script
# Tests all ValueComponent types (Input, Slider, Checkbox, Select, TextArea)

BASE_URL="${BASE_URL:-http://localhost:4000}"
DEMO_PATH="/examples/form-demo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

pass() {
  echo -e "  ${GREEN}✓${NC} $1"
  ((PASSED++))
}

fail() {
  echo -e "  ${RED}✗${NC} $1"
  echo -e "    ${RED}Expected:${NC} $2"
  ((FAILED++))
}

info() {
  echo -e "${BLUE}$1${NC}"
}

# Send event to server and get response
send_event() {
  local component_id="$1"
  local event_type="$2"
  local value="$3"
  
  local data="_componentId=${component_id}&_eventType=${event_type}"
  if [ -n "$value" ]; then
    data="${data}&value=${value}"
  fi
  
  curl -s -X POST "${BASE_URL}/badui/events" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-BadUI-Client-ID: ${CONTEXT_ID}" \
    -d "$data"
}

echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║         BadUI - ValueComponent Test Suite                 ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check server is running
info "Checking server at ${BASE_URL}..."
if ! curl -s "${BASE_URL}" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Server not responding at ${BASE_URL}${NC}"
  echo "Start the server with: bun run apps/demo/src/main.ts"
  exit 1
fi
echo -e "${GREEN}Server is running${NC}"
echo ""

# =============================================================================
# GET INITIAL PAGE AND EXTRACT IDS
# =============================================================================
info "Loading form demo page..."
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)

if [ -z "$CONTEXT_ID" ]; then
  echo -e "${RED}ERROR: Could not get context ID${NC}"
  exit 1
fi
echo "  Context ID: $CONTEXT_ID"

# Extract all component IDs in order
COMPONENT_IDS=($(echo "$RESPONSE" | grep -oE '"_componentId":"c-[a-z0-9]+"' | cut -d'"' -f4))
echo "  Found ${#COMPONENT_IDS[@]} components"
echo ""

# Component order in the form (based on render order):
# 0: nameInput, 1: emailInput, 2: ageInput
# 3: ratingSlider, 4: satisfactionSlider
# 5: subscribeCheckbox, 6: notificationsCheckbox, 7: termsCheckbox
# 8: countrySelect, 9: planSelect
# 10: bioTextArea
# 11+: buttons

NAME_INPUT_ID="${COMPONENT_IDS[0]}"
EMAIL_INPUT_ID="${COMPONENT_IDS[1]}"
AGE_INPUT_ID="${COMPONENT_IDS[2]}"
RATING_SLIDER_ID="${COMPONENT_IDS[3]}"
SATISFACTION_SLIDER_ID="${COMPONENT_IDS[4]}"
SUBSCRIBE_CB_ID="${COMPONENT_IDS[5]}"
NOTIFICATIONS_CB_ID="${COMPONENT_IDS[6]}"
TERMS_CB_ID="${COMPONENT_IDS[7]}"
COUNTRY_SELECT_ID="${COMPONENT_IDS[8]}"
PLAN_SELECT_ID="${COMPONENT_IDS[9]}"
BIO_TEXTAREA_ID="${COMPONENT_IDS[10]}"
FILL_BTN_ID="${COMPONENT_IDS[11]}"
CLEAR_BTN_ID="${COMPONENT_IDS[12]}"

# =============================================================================
# TEST 1: INPUT COMPONENT
# =============================================================================
info "[1/5] Testing INPUT Component"
echo "  Name Input ID: $NAME_INPUT_ID"

# Test 1.1: Renders with placeholder
if echo "$RESPONSE" | grep -q 'placeholder="Enter your name"'; then
  pass "Input renders with placeholder"
else
  fail "Input renders with placeholder" "placeholder='Enter your name'"
fi

# Test 1.2: Change input value
RESULT=$(send_event "$NAME_INPUT_ID" "change" "John%20Doe")
if echo "$RESULT" | grep -q "John Doe"; then
  pass "Input change to 'John Doe' - value updated"
else
  fail "Input change updates value" "John Doe in response"
fi

# Test 1.3: Value persists in HTML attribute
if echo "$RESULT" | grep -q 'value="John Doe"'; then
  pass "Input value persists in HTML attribute"
else
  fail "Input value persists" 'value="John Doe"'
fi

echo ""

# =============================================================================
# TEST 2: SLIDER COMPONENT
# =============================================================================
info "[2/5] Testing SLIDER Component"
echo "  Rating Slider ID: $RATING_SLIDER_ID"

# Refresh page to get clean state
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)
COMPONENT_IDS=($(echo "$RESPONSE" | grep -oE '"_componentId":"c-[a-z0-9]+"' | cut -d'"' -f4))
RATING_SLIDER_ID="${COMPONENT_IDS[3]}"

# Test 2.1: Initial value is 5
if echo "$RESPONSE" | grep -q 'value="5"'; then
  pass "Slider initial value is 5"
else
  fail "Slider initial value" 'value="5"'
fi

# Test 2.2: Change slider to 8
RESULT=$(send_event "$RATING_SLIDER_ID" "change" "8")
if echo "$RESULT" | grep -q 'value="8"'; then
  pass "Slider change to 8 - value updated"
else
  fail "Slider change updates value" 'value="8"'
fi

# Test 2.3: Label shows 8/10
if echo "$RESULT" | grep -q "8/10"; then
  pass "Label bound to slider shows '8/10'"
else
  fail "Label shows slider value" "8/10"
fi

echo ""

# =============================================================================
# TEST 3: CHECKBOX COMPONENT
# =============================================================================
info "[3/5] Testing CHECKBOX Component"

# Refresh page
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)
COMPONENT_IDS=($(echo "$RESPONSE" | grep -oE '"_componentId":"c-[a-z0-9]+"' | cut -d'"' -f4))
SUBSCRIBE_CB_ID="${COMPONENT_IDS[5]}"
echo "  Subscribe Checkbox ID: $SUBSCRIBE_CB_ID"

# Test 3.1: Initially checked (subscribe defaults to true)
if echo "$RESPONSE" | grep -q 'checked'; then
  pass "Checkbox initially checked"
else
  fail "Checkbox initial state" "checked attribute"
fi

# Test 3.2: Uncheck (toggle to false)
RESULT=$(send_event "$SUBSCRIBE_CB_ID" "change" "false")
if echo "$RESULT" | grep -q ">No<"; then
  pass "Checkbox unchecked - label shows 'No'"
else
  fail "Checkbox uncheck" ">No< in label"
fi

# Test 3.3: Check again (toggle to true)
RESULT=$(send_event "$SUBSCRIBE_CB_ID" "change" "true")
if echo "$RESULT" | grep -q ">Yes<"; then
  pass "Checkbox checked - label shows 'Yes'"
else
  fail "Checkbox check" ">Yes< in label"
fi

echo ""

# =============================================================================
# TEST 4: SELECT COMPONENT
# =============================================================================
info "[4/5] Testing SELECT Component"

# Refresh page
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)
COMPONENT_IDS=($(echo "$RESPONSE" | grep -oE '"_componentId":"c-[a-z0-9]+"' | cut -d'"' -f4))
COUNTRY_SELECT_ID="${COMPONENT_IDS[8]}"
echo "  Country Select ID: $COUNTRY_SELECT_ID"

# Test 4.1: Initial value is "us" (selected)
if echo "$RESPONSE" | grep -q 'value="us"'; then
  pass "Select initial value is 'us'"
else
  fail "Select initial value" 'value="us"'
fi

# Test 4.2: Change to "canada"
RESULT=$(send_event "$COUNTRY_SELECT_ID" "change" "canada")
if echo "$RESULT" | grep -q ">canada<"; then
  pass "Select change to 'canada' - label updated"
else
  fail "Select change" ">canada< in label"
fi

echo ""

# =============================================================================
# TEST 5: TEXTAREA COMPONENT
# =============================================================================
info "[5/5] Testing TEXTAREA Component"

# Refresh page
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)
COMPONENT_IDS=($(echo "$RESPONSE" | grep -oE '"_componentId":"c-[a-z0-9]+"' | cut -d'"' -f4))
BIO_TEXTAREA_ID="${COMPONENT_IDS[10]}"
echo "  TextArea ID: $BIO_TEXTAREA_ID"

# Test 5.1: Renders with placeholder
if echo "$RESPONSE" | grep -q 'placeholder="Tell us about yourself..."'; then
  pass "TextArea renders with placeholder"
else
  fail "TextArea placeholder" 'placeholder="Tell us about yourself..."'
fi

# Test 5.2: Change textarea value
RESULT=$(send_event "$BIO_TEXTAREA_ID" "change" "Hello%20World%20from%20TextArea")
if echo "$RESULT" | grep -q "Hello World"; then
  pass "TextArea change updates value"
else
  fail "TextArea change" "Hello World in response"
fi

echo ""

# =============================================================================
# TEST 6: PROGRAMMATIC BUTTON CLICKS
# =============================================================================
info "[BONUS] Testing Programmatic Value Changes via Buttons"

# Refresh page
RESPONSE=$(curl -s "${BASE_URL}${DEMO_PATH}")
CONTEXT_ID=$(echo "$RESPONSE" | grep -oE 'window.__BADUI_CONTEXT_ID__ = "[^"]+"' | cut -d'"' -f2)

# Find the Fill Sample Data button ID dynamically
FILL_BTN_ID=$(echo "$RESPONSE" | tr '>' '\n' | grep -B1 "Fill Sample Data" | head -1 | grep -oE 'id="c-[a-z0-9]+"' | sed 's/id="//;s/"//')
echo "  Fill Sample Data Button ID: $FILL_BTN_ID"

# Test 6.1: Click "Fill Sample Data" button
RESULT=$(send_event "$FILL_BTN_ID" "click" "")

if echo "$RESULT" | grep -q "John Doe"; then
  pass "Fill button sets name to 'John Doe'"
else
  fail "Fill button sets name" "John Doe"
fi

if echo "$RESULT" | grep -q "john@example.com"; then
  pass "Fill button sets email"
else
  fail "Fill button sets email" "john@example.com"
fi

if echo "$RESULT" | grep -q 'value="9"'; then
  pass "Fill button sets rating slider to 9"
else
  fail "Fill button sets rating" 'value="9"'
fi

if echo "$RESULT" | grep -q ">canada<"; then
  pass "Fill button sets country to 'canada'"
else
  fail "Fill button sets country" ">canada<"
fi

if echo "$RESULT" | grep -q ">pro<"; then
  pass "Fill button sets plan to 'pro'"
else
  fail "Fill button sets plan" ">pro<"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
echo ""
TOTAL=$((PASSED + FAILED))
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All $TOTAL tests passed! ✓${NC}"
else
  echo -e "${GREEN}Passed: $PASSED${NC}"
  echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""

exit $FAILED
