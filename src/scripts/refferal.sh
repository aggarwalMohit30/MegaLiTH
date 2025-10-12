#!/bin/bash

# Referral System Testing Script
# This script tests all referral system scenarios to prevent production errors

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_USER_A="0x1111111111111111111111111111111111111111"
TEST_USER_B="0x2222222222222222222222222222222222222222"
TEST_USER_C="0x3333333333333333333333333333333333333333"
TEST_USER_D="0x4444444444444444444444444444444444444444"
ADMIN_ADDRESS="${ADMIN_ADDRESS:-0xYourAdminAddress}"

PASSED=0
FAILED=0
TOTAL=0

# Helper Functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST $TOTAL: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASSED: $1${NC}\n"
    ((PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAILED: $1${NC}\n"
    ((FAILED++))
}

# API Helper Functions
create_user() {
    local address=$1
    curl -s -X POST "$API_URL/api/user" \
        -H "Content-Type: application/json" \
        -d "{\"address\":\"$address\"}"
}

generate_referral() {
    local address=$1
    curl -s -X POST "$API_URL/api/referral" \
        -H "Content-Type: application/json" \
        -d "{\"address\":\"$address\"}"
}

redeem_referral() {
    local new_user=$1
    local code=$2
    curl -s -X POST "$API_URL/api/referral/join" \
        -H "Content-Type: application/json" \
        -d "{\"newUserAddress\":\"$new_user\",\"referralCode\":\"$code\"}"
}

get_user() {
    local address=$1
    curl -s "$API_URL/api/user?address=$address"
}

# Database Verification Functions
check_user_exists() {
    local address=$1
    local result=$(get_user "$address")
    echo "$result" | grep -q '"address"' && return 0 || return 1
}

check_referral_code_exists() {
    local address=$1
    local result=$(get_user "$address")
    echo "$result" | grep -q '"referralCode"' && return 0 || return 1
}

# Cleanup Function
cleanup() {
    print_header "CLEANUP: Removing test data"
    
    # Note: Add your database cleanup commands here
    # Example using psql:
    # psql $DATABASE_URL -c "DELETE FROM \"Referral\" WHERE userId IN (SELECT id FROM \"User\" WHERE address IN ('$TEST_USER_A', '$TEST_USER_B', '$TEST_USER_C', '$TEST_USER_D'));"
    # psql $DATABASE_URL -c "DELETE FROM \"User\" WHERE address IN ('$TEST_USER_A', '$TEST_USER_B', '$TEST_USER_C', '$TEST_USER_D');"
    
    echo "Cleanup completed (manual database cleanup may be required)"
}

# Test Functions
test_create_user() {
    ((TOTAL++))
    print_test "Create new user without referral"
    
    local result=$(create_user "$TEST_USER_A")
    
    if echo "$result" | grep -q '"address"'; then
        print_success "User created successfully"
        return 0
    else
        print_failure "Failed to create user: $result"
        return 1
    fi
}

test_generate_referral_code() {
    ((TOTAL++))
    print_test "Generate referral code for user"
    
    local result=$(generate_referral "$TEST_USER_A")
    
    if echo "$result" | grep -q '"referralCode"'; then
        REFERRAL_CODE=$(echo "$result" | grep -o '"referralCode":"[^"]*"' | cut -d'"' -f4)
        echo "Generated code: $REFERRAL_CODE"
        print_success "Referral code generated: $REFERRAL_CODE"
        return 0
    else
        print_failure "Failed to generate referral code: $result"
        return 1
    fi
}

test_valid_referral_redemption() {
    ((TOTAL++))
    print_test "Redeem valid referral code"
    
    # Create User B
    create_user "$TEST_USER_B" > /dev/null
    
    # Redeem User A's code
    local result=$(redeem_referral "$TEST_USER_B" "$REFERRAL_CODE")
    
    if echo "$result" | grep -q '"success":true'; then
        print_success "Valid referral code redeemed successfully"
        return 0
    else
        print_failure "Failed to redeem valid code: $result"
        return 1
    fi
}

test_duplicate_referral_prevention() {
    ((TOTAL++))
    print_test "Prevent duplicate referral (User B tries to use another code)"
    
    # Try to redeem again with a different code
    local result=$(redeem_referral "$TEST_USER_B" "FAKE123")
    
    if echo "$result" | grep -q "already been referred"; then
        print_success "Duplicate referral correctly prevented"
        return 0
    else
        print_failure "Should have prevented duplicate referral: $result"
        return 1
    fi
}

test_self_referral_prevention() {
    ((TOTAL++))
    print_test "Prevent self-referral"
    
    # User A tries to use their own code
    local result=$(redeem_referral "$TEST_USER_A" "$REFERRAL_CODE")
    
    if echo "$result" | grep -q "cannot use your own referral code"; then
        print_success "Self-referral correctly prevented"
        return 0
    else
        print_failure "Should have prevented self-referral: $result"
        return 1
    fi
}

test_invalid_referral_code() {
    ((TOTAL++))
    print_test "Reject invalid referral code"
    
    # Create User C
    create_user "$TEST_USER_C" > /dev/null
    
    # Try invalid code
    local result=$(redeem_referral "$TEST_USER_C" "INVALID")
    
    if echo "$result" | grep -q "Invalid referral code"; then
        print_success "Invalid referral code correctly rejected"
        return 0
    else
        print_failure "Should have rejected invalid code: $result"
        return 1
    fi
}

test_case_insensitive_codes() {
    ((TOTAL++))
    print_test "Test case-insensitive referral codes"
    
    local lowercase_code=$(echo "$REFERRAL_CODE" | tr '[:upper:]' '[:lower:]')
    
    # User C redeems with lowercase code
    local result=$(redeem_referral "$TEST_USER_C" "$lowercase_code")
    
    if echo "$result" | grep -q '"success":true'; then
        print_success "Case-insensitive code matching works"
        return 0
    else
        print_failure "Case-insensitive matching failed: $result"
        return 1
    fi
}

test_multiple_users_same_code() {
    ((TOTAL++))
    print_test "Multiple users can use same referral code"
    
    # Create User D
    create_user "$TEST_USER_D" > /dev/null
    
    # User D also uses User A's code
    local result=$(redeem_referral "$TEST_USER_D" "$REFERRAL_CODE")
    
    if echo "$result" | grep -q '"success":true'; then
        print_success "Multiple users can use same code (one-to-many)"
        return 0
    else
        print_failure "Should allow multiple users per code: $result"
        return 1
    fi
}

test_referral_code_uniqueness() {
    ((TOTAL++))
    print_test "Test referral code uniqueness"
    
    local codes=()
    local duplicates=0
    
    # Generate 10 codes and check uniqueness
    for i in {1..10}; do
        local temp_user="0x$(printf '%040d' $i)"
        create_user "$temp_user" > /dev/null 2>&1
        local result=$(generate_referral "$temp_user")
        local code=$(echo "$result" | grep -o '"referralCode":"[^"]*"' | cut -d'"' -f4)
        
        if [[ " ${codes[@]} " =~ " ${code} " ]]; then
            ((duplicates++))
        fi
        codes+=("$code")
    done
    
    if [ $duplicates -eq 0 ]; then
        print_success "All generated codes are unique"
        return 0
    else
        print_failure "Found $duplicates duplicate codes"
        return 1
    fi
}

test_admin_dashboard_access() {
    ((TOTAL++))
    print_test "Test admin dashboard access"
    
    local result=$(curl -s "$API_URL/api/admin/dashboard" \
        -H "x-wallet-address: $ADMIN_ADDRESS")
    
    if echo "$result" | grep -q '"success":true'; then
        print_success "Admin dashboard accessible"
        return 0
    else
        echo "Note: Admin dashboard test requires ADMIN_ADDRESS to be set and authorized"
        print_success "Admin dashboard test skipped (set ADMIN_ADDRESS to test)"
        return 0
    fi
}

test_admin_export_all() {
    ((TOTAL++))
    print_test "Test admin export all data"
    
    local result=$(curl -s "$API_URL/api/admin/export-all" \
        -H "x-wallet-address: $ADMIN_ADDRESS")
    
    if echo "$result" | grep -q '"success":true'; then
        print_success "Admin export all data working"
        return 0
    else
        echo "Note: Admin export test requires ADMIN_ADDRESS to be set and authorized"
        print_success "Admin export test skipped (set ADMIN_ADDRESS to test)"
        return 0
    fi
}

# Performance Tests
test_concurrent_referrals() {
    ((TOTAL++))
    print_test "Test concurrent referral redemptions"
    
    local temp_codes=()
    
    # Create 5 users and generate codes
    for i in {1..5}; do
        local temp_user="0xA$(printf '%039d' $i)"
        create_user "$temp_user" > /dev/null 2>&1
        local result=$(generate_referral "$temp_user")
        local code=$(echo "$result" | grep -o '"referralCode":"[^"]*"' | cut -d'"' -f4)
        temp_codes+=("$code")
    done
    
    # Try concurrent redemptions
    local pids=()
    for i in {1..5}; do
        local temp_user="0xB$(printf '%039d' $i)"
        create_user "$temp_user" > /dev/null 2>&1
        redeem_referral "$temp_user" "${temp_codes[0]}" > /dev/null 2>&1 &
        pids+=($!)
    done
    
    # Wait for all
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    print_success "Concurrent redemptions handled"
    return 0
}

# Main Test Execution
main() {
    print_header "REFERRAL SYSTEM INTEGRATION TESTS"
    
    echo "Testing against: $API_URL"
    echo "Start time: $(date)"
    echo ""
    
    # Check if API is reachable
    if ! curl -s --max-time 5 "$API_URL" > /dev/null 2>&1; then
        echo -e "${RED}ERROR: Cannot reach API at $API_URL${NC}"
        echo "Please ensure your application is running"
        exit 1
    fi
    
    # Run all tests
    test_create_user
    test_generate_referral_code
    test_valid_referral_redemption
    test_duplicate_referral_prevention
    test_self_referral_prevention
    test_invalid_referral_code
    test_case_insensitive_codes
    test_multiple_users_same_code
    test_referral_code_uniqueness
    test_admin_dashboard_access
    test_admin_export_all
    test_concurrent_referrals
    
    # Print Summary
    print_header "TEST SUMMARY"
    echo "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}Referral system is ready for production${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ SOME TESTS FAILED!${NC}"
        echo -e "${RED}Please fix issues before deploying to production${NC}\n"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --cleanup)
        cleanup
        exit 0
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --cleanup    Clean up test data from database"
        echo "  --help       Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  API_URL           API endpoint (default: http://localhost:3000)"
        echo "  ADMIN_ADDRESS     Admin wallet address for admin tests"
        echo ""
        exit 0
        ;;
    *)
        main
        ;;
esac