#!/usr/bin/env python3
import requests
import json
import time
import unittest
import random
import string

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL has no trailing slash
BACKEND_URL = BACKEND_URL.rstrip('/')
API_URL = f"{BACKEND_URL}/api"

print(f"Using API URL: {API_URL}")

def generate_random_string(length=8):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

class AuthenticationAPITest(unittest.TestCase):
    """Test suite for the Authentication endpoints of the Clinical Insight Assistant API"""
    
    def setUp(self):
        """Set up test data"""
        # Generate unique test data for each test run
        timestamp = int(time.time())
        random_suffix = generate_random_string()
        self.test_username = f"testuser_{timestamp}_{random_suffix}"
        self.test_email = f"test_{timestamp}_{random_suffix}@example.com"
        self.test_password = "SecurePassword123!"
        self.test_full_name = "Test User"
        self.session_token = None
        self.user_id = None
    
    def test_01_register_user(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        register_payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password,
            "full_name": self.test_full_name
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        print(f"Registration response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        self.assertIn("id", user_data)
        self.assertEqual(user_data["username"], self.test_username)
        self.assertEqual(user_data["email"], self.test_email)
        self.assertEqual(user_data["full_name"], self.test_full_name)
        
        # Save user ID for later tests
        self.user_id = user_data["id"]
        print(f"✅ User registration successful. User ID: {self.user_id}")
        
        # Test duplicate username registration
        print("\nTesting duplicate username registration")
        duplicate_username_payload = {
            "username": self.test_username,  # Same username
            "email": f"different_{self.test_email}",
            "password": self.test_password,
            "full_name": self.test_full_name
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=duplicate_username_payload)
        print(f"Duplicate username registration response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 400)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Username already exists")
        print("✅ Duplicate username registration correctly rejected")
        
        # Test duplicate email registration
        print("\nTesting duplicate email registration")
        duplicate_email_payload = {
            "username": f"different_{self.test_username}",
            "email": self.test_email,  # Same email
            "password": self.test_password,
            "full_name": self.test_full_name
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=duplicate_email_payload)
        print(f"Duplicate email registration response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 400)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Email already exists")
        print("✅ Duplicate email registration correctly rejected")
    
    def test_02_login_user(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Register a new user specifically for this test
        timestamp = int(time.time())
        random_suffix = generate_random_string()
        login_username = f"loginuser_{timestamp}_{random_suffix}"
        login_email = f"login_{timestamp}_{random_suffix}@example.com"
        login_password = "LoginPassword123!"
        
        register_payload = {
            "username": login_username,
            "email": login_email,
            "password": login_password,
            "full_name": "Login Test User"
        }
        
        register_response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        self.assertEqual(register_response.status_code, 200)
        print(f"Created test user for login test: {login_username}")
        
        # Test successful login
        login_payload = {
            "username": login_username,
            "password": login_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        print(f"Login response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        login_data = response.json()
        self.assertIn("session_token", login_data)
        self.assertIn("user", login_data)
        self.assertEqual(login_data["user"]["username"], login_username)
        self.assertEqual(login_data["user"]["email"], login_email)
        
        # Save session token for subsequent tests
        self.session_token = login_data["session_token"]
        print(f"✅ User login successful. Session token obtained.")
        
        # Test login with invalid username
        print("\nTesting login with invalid username")
        invalid_username_payload = {
            "username": f"nonexistent_{self.test_username}",
            "password": self.test_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=invalid_username_payload)
        print(f"Invalid username login response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Invalid username or password")
        print("✅ Login with invalid username correctly rejected")
        
        # Test login with invalid password
        print("\nTesting login with invalid password")
        invalid_password_payload = {
            "username": self.test_username,
            "password": f"wrong_{self.test_password}"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=invalid_password_payload)
        print(f"Invalid password login response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Invalid username or password")
        print("✅ Login with invalid password correctly rejected")
        
        # Test multiple successful logins (should create new session tokens)
        print("\nTesting multiple successful logins")
        response1 = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(response1.status_code, 200)
        token1 = response1.json()["session_token"]
        
        response2 = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(response2.status_code, 200)
        token2 = response2.json()["session_token"]
        
        self.assertNotEqual(token1, token2, "Multiple logins should create different session tokens")
        print("✅ Multiple logins create unique session tokens")
    
    def test_03_verify_session(self):
        """Test session verification endpoint"""
        print("\n=== Testing Session Verification ===")
        
        # Create a new user and get a session token
        timestamp = int(time.time())
        random_suffix = generate_random_string()
        verify_username = f"verifyuser_{timestamp}_{random_suffix}"
        verify_email = f"verify_{timestamp}_{random_suffix}@example.com"
        verify_password = "VerifyPassword123!"
        
        # Register
        register_payload = {
            "username": verify_username,
            "email": verify_email,
            "password": verify_password,
            "full_name": "Verify Test User"
        }
        
        register_response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        self.assertEqual(register_response.status_code, 200)
        
        # Login to get session token
        login_payload = {
            "username": verify_username,
            "password": verify_password
        }
        
        login_response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(login_response.status_code, 200)
        session_token = login_response.json()["session_token"]
        print(f"Created test user and obtained session token for verification test")
        
        # Test valid session verification
        print("Testing valid session verification")
        response = requests.get(f"{API_URL}/auth/verify?session_token={session_token}")
        print(f"Session verification response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        verify_data = response.json()
        self.assertTrue(verify_data["valid"])
        self.assertEqual(verify_data["user"]["username"], verify_username)
        print("✅ Valid session correctly verified")
        
        # Test invalid session token
        print("\nTesting invalid session token")
        invalid_token = "invalid_token_" + generate_random_string(32)
        response = requests.get(f"{API_URL}/auth/verify?session_token={invalid_token}")
        print(f"Invalid token verification response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Invalid or expired session")
        print("✅ Invalid session token correctly rejected")
        
        # Test empty session token
        print("\nTesting empty session token")
        response = requests.get(f"{API_URL}/auth/verify")
        print(f"Empty token verification response status: {response.status_code}")
        
        self.assertNotEqual(response.status_code, 200)  # Should not be successful
        print("✅ Empty session token correctly handled")
    
    def test_04_logout_user(self):
        """Test user logout endpoint"""
        print("\n=== Testing User Logout ===")
        
        # First, ensure we have a valid session token
        if not self.session_token:
            login_payload = {
                "username": self.test_username,
                "password": self.test_password
            }
            response = requests.post(f"{API_URL}/auth/login", json=login_payload)
            self.assertEqual(response.status_code, 200)
            self.session_token = response.json()["session_token"]
        
        # Test successful logout
        print("Testing successful logout")
        response = requests.post(f"{API_URL}/auth/logout?session_token={self.session_token}")
        print(f"Logout response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        logout_data = response.json()
        self.assertIn("message", logout_data)
        self.assertEqual(logout_data["message"], "Logout successful")
        print("✅ User logout successful")
        
        # Verify session is invalid after logout
        print("\nVerifying session is invalid after logout")
        response = requests.get(f"{API_URL}/auth/verify?session_token={self.session_token}")
        print(f"Post-logout verification response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        print("✅ Session correctly invalidated after logout")
        
        # Test logout with invalid session token
        print("\nTesting logout with invalid session token")
        invalid_token = "invalid_token_" + generate_random_string(32)
        response = requests.post(f"{API_URL}/auth/logout?session_token={invalid_token}")
        print(f"Invalid token logout response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertEqual(error_data["detail"], "Invalid session")
        print("✅ Logout with invalid session token correctly rejected")
        
        # Test multiple logouts (second should fail)
        print("\nTesting multiple logouts")
        # First, get a new valid token
        login_payload = {
            "username": self.test_username,
            "password": self.test_password
        }
        login_response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(login_response.status_code, 200)
        new_token = login_response.json()["session_token"]
        
        # First logout should succeed
        response1 = requests.post(f"{API_URL}/auth/logout?session_token={new_token}")
        self.assertEqual(response1.status_code, 200)
        
        # Second logout with same token should fail
        response2 = requests.post(f"{API_URL}/auth/logout?session_token={new_token}")
        self.assertEqual(response2.status_code, 401)
        print("✅ Multiple logouts correctly handled")
    
    def test_05_comprehensive_auth_flow(self):
        """Test the complete authentication flow with edge cases"""
        print("\n=== Testing Comprehensive Authentication Flow ===")
        
        # Generate unique credentials for this test
        timestamp = int(time.time())
        random_suffix = generate_random_string()
        username = f"flowuser_{timestamp}_{random_suffix}"
        email = f"flow_{timestamp}_{random_suffix}@example.com"
        password = "FlowPassword123!"
        
        # 1. Register a new user
        print("1. Registering a new user")
        register_payload = {
            "username": username,
            "email": email,
            "password": password,
            "full_name": "Flow Test User"
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_id = user_data["id"]
        print(f"User registered with ID: {user_id}")
        
        # 2. Login with the new user
        print("\n2. Logging in with the new user")
        login_payload = {
            "username": username,
            "password": password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 200)
        login_data = response.json()
        token1 = login_data["session_token"]
        print(f"User logged in, session token: {token1[:10]}...")
        
        # 3. Verify the session
        print("\n3. Verifying the session")
        response = requests.get(f"{API_URL}/auth/verify?session_token={token1}")
        self.assertEqual(response.status_code, 200)
        verify_data = response.json()
        self.assertTrue(verify_data["valid"])
        print("Session verified successfully")
        
        # 4. Login again (multiple active sessions)
        print("\n4. Logging in again (creating multiple sessions)")
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 200)
        token2 = response.json()["session_token"]
        print(f"User logged in again, new session token: {token2[:10]}...")
        
        # 5. Verify both sessions are valid
        print("\n5. Verifying both sessions are valid")
        response1 = requests.get(f"{API_URL}/auth/verify?session_token={token1}")
        response2 = requests.get(f"{API_URL}/auth/verify?session_token={token2}")
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)
        print("Both sessions verified successfully")
        
        # 6. Logout from first session
        print("\n6. Logging out from first session")
        response = requests.post(f"{API_URL}/auth/logout?session_token={token1}")
        self.assertEqual(response.status_code, 200)
        print("Logged out from first session")
        
        # 7. Verify first session is invalid but second is still valid
        print("\n7. Verifying first session is invalid but second is still valid")
        response1 = requests.get(f"{API_URL}/auth/verify?session_token={token1}")
        response2 = requests.get(f"{API_URL}/auth/verify?session_token={token2}")
        self.assertEqual(response1.status_code, 401)
        self.assertEqual(response2.status_code, 200)
        print("First session correctly invalidated, second session still valid")
        
        # 8. Logout from second session
        print("\n8. Logging out from second session")
        response = requests.post(f"{API_URL}/auth/logout?session_token={token2}")
        self.assertEqual(response.status_code, 200)
        print("Logged out from second session")
        
        # 9. Verify both sessions are now invalid
        print("\n9. Verifying both sessions are now invalid")
        response1 = requests.get(f"{API_URL}/auth/verify?session_token={token1}")
        response2 = requests.get(f"{API_URL}/auth/verify?session_token={token2}")
        self.assertEqual(response1.status_code, 401)
        self.assertEqual(response2.status_code, 401)
        print("Both sessions correctly invalidated")
        
        # 10. Try to logout from an already logged out session
        print("\n10. Trying to logout from an already logged out session")
        response = requests.post(f"{API_URL}/auth/logout?session_token={token1}")
        self.assertEqual(response.status_code, 401)
        print("Logout from already logged out session correctly rejected")
        
        print("✅ Comprehensive authentication flow test passed")

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)