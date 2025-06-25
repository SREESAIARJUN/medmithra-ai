#!/usr/bin/env python3
import requests
import json
import os
import unittest
import time
from datetime import datetime

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

class ClinicalInsightAPIHttpxTest(unittest.TestCase):
    """Test suite for the Clinical Insight Assistant API after httpx dependency fix"""
    
    def setUp(self):
        """Set up test data"""
        # Generate unique test data
        timestamp = int(time.time())
        self.test_username = f"testuser_{timestamp}"
        self.test_email = f"test_{timestamp}@example.com"
        self.test_password = "SecurePassword123!"
        self.test_doctor_name = "Dr. John Smith"
        
        self.sample_patient_data = {
            "patient_summary": "45-year-old male presents with chest pain, shortness of breath, and fatigue for 3 days. No previous cardiac history. Vital signs: BP 140/90, HR 95, RR 18, Temp 98.6F",
            "patient_id": f"PT{timestamp}",
            "patient_name": "John Doe",
            "patient_age": 45,
            "patient_gender": "Male",
            "doctor_id": "test_doctor",
            "doctor_name": self.test_doctor_name
        }
        
    def test_01_api_connectivity(self):
        """Test basic API connectivity to verify httpx dependency is working"""
        print("\n=== Testing API Connectivity ===")
        response = requests.get(f"{API_URL}/")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertEqual(response.json()["message"], "Clinical Insight Assistant API")
        print("✅ API connectivity test passed")
        
    def test_02_authentication_endpoints(self):
        """Test authentication endpoints (register, login, verify, logout)"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # 1. Test user registration
        print("1. Testing user registration")
        register_payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password,
            "full_name": "Test User",
            "medical_license": "MD12345",
            "specialization": "Internal Medicine",
            "years_of_experience": 5,
            "hospital_affiliation": "Test Hospital",
            "phone_number": "555-123-4567"
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        print(f"Registration response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        self.assertIn("id", user_data)
        self.assertEqual(user_data["username"], self.test_username)
        self.assertEqual(user_data["email"], self.test_email)
        print(f"✅ Successfully registered user: {self.test_username}")
        
        # 2. Test user login
        print("\n2. Testing user login")
        login_payload = {
            "username": self.test_username,
            "password": self.test_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        print(f"Login response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        login_data = response.json()
        self.assertIn("session_token", login_data)
        self.assertIn("user", login_data)
        self.assertEqual(login_data["user"]["username"], self.test_username)
        
        # Save session token for subsequent tests
        self.session_token = login_data["session_token"]
        print(f"✅ Successfully logged in user: {self.test_username}")
        
        # 3. Test session verification
        print("\n3. Testing session verification")
        response = requests.get(f"{API_URL}/auth/verify?session_token={self.session_token}")
        print(f"Session verification response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        verify_data = response.json()
        self.assertTrue(verify_data["valid"])
        self.assertEqual(verify_data["user"]["username"], self.test_username)
        print("✅ Successfully verified session")
        
        # 4. Test logout
        print("\n4. Testing user logout")
        response = requests.post(f"{API_URL}/auth/logout?session_token={self.session_token}")
        print(f"Logout response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        logout_data = response.json()
        self.assertIn("message", logout_data)
        print("✅ Successfully logged out user")
        
        # 5. Verify session is invalid after logout
        print("\n5. Verifying session is invalid after logout")
        response = requests.get(f"{API_URL}/auth/verify?session_token={self.session_token}")
        print(f"Post-logout verification response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 401)
        print("✅ Session correctly invalidated after logout")
        
    def test_03_case_creation(self):
        """Test case creation to verify core functionality"""
        print("\n=== Testing Case Creation ===")
        
        response = requests.post(f"{API_URL}/cases", json=self.sample_patient_data)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("id", response_data)
        self.assertEqual(response_data["patient_summary"], self.sample_patient_data["patient_summary"])
        self.assertEqual(response_data["patient_id"], self.sample_patient_data["patient_id"])
        self.assertEqual(response_data["patient_name"], self.sample_patient_data["patient_name"])
        self.assertEqual(response_data["patient_age"], self.sample_patient_data["patient_age"])
        self.assertEqual(response_data["patient_gender"], self.sample_patient_data["patient_gender"])
        self.assertEqual(response_data["doctor_id"], self.sample_patient_data["doctor_id"])
        self.assertEqual(response_data["doctor_name"], self.sample_patient_data["doctor_name"])
        
        # Save case ID for reference
        self.case_id = response_data["id"]
        print(f"✅ Case creation test passed. Case ID: {self.case_id}")
        
        # Verify case retrieval
        print("\nVerifying case retrieval")
        response = requests.get(f"{API_URL}/cases/{self.case_id}")
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        case = response.json()
        self.assertEqual(case["id"], self.case_id)
        self.assertEqual(case["patient_summary"], self.sample_patient_data["patient_summary"])
        print("✅ Case retrieval test passed")

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)