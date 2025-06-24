#!/usr/bin/env python3
import requests
import json
import os
import tempfile
import unittest
import time

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

class ClinicalInsightAPITest(unittest.TestCase):
    """Test suite for the Clinical Insight Assistant API"""
    
    def setUp(self):
        """Set up test data"""
        self.sample_patient_summary = "45-year-old male presents with chest pain, shortness of breath, and fatigue for 3 days. No previous cardiac history. Vital signs: BP 140/90, HR 95, RR 18, Temp 98.6F"
        self.case_id = None
        
    def test_01_api_connectivity(self):
        """Test basic API connectivity"""
        print("\n=== Testing API Connectivity ===")
        response = requests.get(f"{API_URL}/")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertEqual(response.json()["message"], "Clinical Insight Assistant API")
        print("✅ API connectivity test passed")
        
    def test_02_create_case(self):
        """Test case creation"""
        print("\n=== Testing Case Creation ===")
        payload = {
            "patient_summary": self.sample_patient_summary,
            "doctor_id": "test_doctor"
        }
        
        response = requests.post(f"{API_URL}/cases", json=payload)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("id", response_data)
        self.assertEqual(response_data["patient_summary"], self.sample_patient_summary)
        
        # Save case ID for subsequent tests
        self.__class__.case_id = response_data["id"]
        print(f"✅ Case creation test passed. Case ID: {self.__class__.case_id}")
        
    def test_03_file_upload(self):
        """Test file upload to a case"""
        if not hasattr(self.__class__, 'case_id') or not self.__class__.case_id:
            self.skipTest("Case ID not available. Skipping file upload test.")
            
        print("\n=== Testing File Upload ===")
        
        # Create a temporary file with medical notes
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
            temp.write(b"ECG Results: Normal sinus rhythm. No ST elevation. No significant Q waves.")
            temp_path = temp.name
            
        try:
            files = [('files', ('ecg_results.txt', open(temp_path, 'rb'), 'text/plain'))]
            
            response = requests.post(
                f"{API_URL}/cases/{self.__class__.case_id}/upload",
                files=files
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text[:200]}...")
            
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn("message", response_data)
            self.assertIn("files", response_data)
            self.assertEqual(len(response_data["files"]), 1)
            print("✅ File upload test passed")
            
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_04_analyze_case(self):
        """Test case analysis with Gemini integration"""
        if not hasattr(self.__class__, 'case_id') or not self.__class__.case_id:
            self.skipTest("Case ID not available. Skipping analysis test.")
            
        print("\n=== Testing Case Analysis with Gemini Integration ===")
        
        response = requests.post(f"{API_URL}/cases/{self.__class__.case_id}/analyze")
        print(f"Response status: {response.status_code}")
        
        # Print a truncated version of the response to avoid overwhelming the logs
        response_data = response.json()
        print(f"Response structure: {json.dumps(list(response_data.keys()), indent=2)}")
        
        if "soap_note" in response_data:
            print("SOAP Note structure:")
            print(json.dumps(list(response_data["soap_note"].keys()), indent=2))
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the structure of the response
        self.assertIn("soap_note", response_data)
        self.assertIn("differential_diagnoses", response_data)
        self.assertIn("treatment_recommendations", response_data)
        
        # Check SOAP note structure
        soap_note = response_data["soap_note"]
        self.assertIn("subjective", soap_note)
        self.assertIn("objective", soap_note)
        self.assertIn("assessment", soap_note)
        self.assertIn("plan", soap_note)
        
        # Check differential diagnoses
        diff_diagnoses = response_data["differential_diagnoses"]
        self.assertIsInstance(diff_diagnoses, list)
        if diff_diagnoses:
            self.assertIn("diagnosis", diff_diagnoses[0])
            self.assertIn("likelihood", diff_diagnoses[0])
            
        # Check treatment recommendations
        treatments = response_data["treatment_recommendations"]
        self.assertIsInstance(treatments, list)
        
        # Check confidence score
        self.assertIn("confidence_score", response_data)
        self.assertIsInstance(response_data["confidence_score"], (int, float))
        
        print("✅ Case analysis test passed")
        
    def test_05_get_cases(self):
        """Test retrieving all cases"""
        print("\n=== Testing Case Retrieval ===")
        
        response = requests.get(f"{API_URL}/cases?doctor_id=test_doctor")
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        cases = response.json()
        self.assertIsInstance(cases, list)
        
        # Check if our created case is in the list
        if hasattr(self.__class__, 'case_id') and self.__class__.case_id:
            case_ids = [case["id"] for case in cases]
            self.assertIn(self.__class__.case_id, case_ids)
            print(f"Found our test case in the retrieved cases list")
        
        print(f"Retrieved {len(cases)} cases")
        print("✅ Case retrieval test passed")
        
    def test_06_get_specific_case(self):
        """Test retrieving a specific case"""
        if not hasattr(self.__class__, 'case_id') or not self.__class__.case_id:
            self.skipTest("Case ID not available. Skipping specific case retrieval test.")
            
        print("\n=== Testing Specific Case Retrieval ===")
        
        response = requests.get(f"{API_URL}/cases/{self.__class__.case_id}")
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        case = response.json()
        self.assertEqual(case["id"], self.__class__.case_id)
        self.assertEqual(case["patient_summary"], self.sample_patient_summary)
        
        # Check if analysis results are present
        self.assertIn("analysis_result", case)
        if case["analysis_result"]:
            print("Analysis results are present in the case")
            
        print("✅ Specific case retrieval test passed")
        
    def test_07_query_cases(self):
        """Test querying cases"""
        print("\n=== Testing Case Querying ===")
        
        payload = {
            "query": "chest pain",
            "doctor_id": "test_doctor"
        }
        
        response = requests.post(f"{API_URL}/query", json=payload)
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("response", response_data)
        
        if "cases" in response_data:
            print(f"Query returned {len(response_data['cases'])} cases")
            
        print("✅ Case querying test passed")

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)