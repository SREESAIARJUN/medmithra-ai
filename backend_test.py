#!/usr/bin/env python3
import requests
import json
import os
import tempfile
import unittest
import time
from datetime import datetime, timedelta

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
        self.complex_patient_summary = "67-year-old female with diabetes presents with acute chest pain, elevated troponin levels, and shortness of breath. History of hypertension and smoking."
        self.case_id = None
        self.complex_case_id = None
        
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
        
    def test_07_query_cases_fixed(self):
        """Test the FIXED query endpoint with various query types"""
        print("\n=== Testing FIXED Query Endpoint ===")
        
        # Test various query types
        query_types = [
            {"name": "Text search", "query": "chest pain"},
            {"name": "Today query", "query": "today"},
            {"name": "Yesterday query", "query": "yesterday"},
            {"name": "Lab query", "query": "lab test"},
            {"name": "Patient ID query", "query": "patient 123"}
        ]
        
        for query_type in query_types:
            print(f"\nTesting query type: {query_type['name']}")
            payload = {
                "query": query_type["query"],
                "doctor_id": "test_doctor"
            }
            
            response = requests.post(f"{API_URL}/query", json=payload)
            print(f"Response status: {response.status_code}")
            
            self.assertEqual(response.status_code, 200, f"Query '{query_type['query']}' failed with status {response.status_code}")
            response_data = response.json()
            self.assertIn("response", response_data)
            
            # Check for serialization issues
            if "cases" in response_data:
                print(f"Query returned {len(response_data['cases'])} cases")
                
                # Verify no ObjectId serialization issues
                for case in response_data["cases"]:
                    self.assertNotIn("_id", case, "MongoDB ObjectId still present in response")
                    
                    # Check datetime serialization
                    if "created_at" in case:
                        self.assertIsInstance(case["created_at"], str, "created_at not properly serialized to string")
                    if "updated_at" in case:
                        self.assertIsInstance(case["updated_at"], str, "updated_at not properly serialized to string")
                        
                    # Check file upload dates
                    for file_info in case.get("uploaded_files", []):
                        if "uploaded_at" in file_info:
                            self.assertIsInstance(file_info["uploaded_at"], str, "file uploaded_at not properly serialized to string")
            
        print("✅ FIXED Query endpoint test passed")
        
    def test_08_feedback_system(self):
        """Test the new Feedback System"""
        if not hasattr(self.__class__, 'case_id') or not self.__class__.case_id:
            self.skipTest("Case ID not available. Skipping feedback system test.")
            
        print("\n=== Testing Feedback System ===")
        
        # Test positive feedback
        print("Testing positive feedback submission")
        positive_payload = {
            "case_id": self.__class__.case_id,
            "doctor_id": "test_doctor",
            "feedback_type": "positive",
            "feedback_text": "The analysis was very accurate and helpful."
        }
        
        response = requests.post(f"{API_URL}/cases/{self.__class__.case_id}/feedback", json=positive_payload)
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("id", response_data)
        self.assertEqual(response_data["feedback_type"], "positive")
        
        # Test negative feedback
        print("\nTesting negative feedback submission")
        negative_payload = {
            "case_id": self.__class__.case_id,
            "doctor_id": "test_doctor",
            "feedback_type": "negative",
            "feedback_text": "The differential diagnoses could be improved."
        }
        
        response = requests.post(f"{API_URL}/cases/{self.__class__.case_id}/feedback", json=negative_payload)
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("id", response_data)
        self.assertEqual(response_data["feedback_type"], "negative")
        
        # Test feedback statistics
        print("\nTesting feedback statistics")
        response = requests.get(f"{API_URL}/feedback/stats?doctor_id=test_doctor")
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        stats = response.json()
        self.assertIn("positive_feedback", stats)
        self.assertIn("negative_feedback", stats)
        self.assertIn("total_feedback", stats)
        self.assertIn("satisfaction_rate", stats)
        
        # Verify we have at least the feedback we just submitted
        self.assertGreaterEqual(stats["positive_feedback"], 1)
        self.assertGreaterEqual(stats["negative_feedback"], 1)
        self.assertGreaterEqual(stats["total_feedback"], 2)
        
        print(f"Feedback stats: {json.dumps(stats, indent=2)}")
        print("✅ Feedback system test passed")
        
    def test_09_advanced_search(self):
        """Test Advanced Search functionality"""
        print("\n=== Testing Advanced Search ===")
        
        # Create a complex case for testing advanced search
        print("Creating a complex case for advanced search testing")
        payload = {
            "patient_summary": self.complex_patient_summary,
            "doctor_id": "test_doctor"
        }
        
        response = requests.post(f"{API_URL}/cases", json=payload)
        self.assertEqual(response.status_code, 200)
        complex_case = response.json()
        self.__class__.complex_case_id = complex_case["id"]
        print(f"Created complex case with ID: {self.__class__.complex_case_id}")
        
        # Test various search filters
        search_tests = [
            {
                "name": "Text search",
                "filters": {
                    "doctor_id": "test_doctor",
                    "search_text": "diabetes"
                }
            },
            {
                "name": "Date range",
                "filters": {
                    "doctor_id": "test_doctor",
                    "date_from": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "date_to": (datetime.utcnow() + timedelta(days=1)).isoformat()
                }
            },
            {
                "name": "Has files filter",
                "filters": {
                    "doctor_id": "test_doctor",
                    "has_files": False
                }
            },
            {
                "name": "Combined filters",
                "filters": {
                    "doctor_id": "test_doctor",
                    "search_text": "chest",
                    "date_from": (datetime.utcnow() - timedelta(days=1)).isoformat()
                }
            }
        ]
        
        for test in search_tests:
            print(f"\nTesting {test['name']}")
            response = requests.post(f"{API_URL}/cases/search", json=test["filters"])
            print(f"Response status: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn("cases", result)
            self.assertIn("total_found", result)
            self.assertIn("filters_applied", result)
            
            print(f"Found {result['total_found']} cases")
            
            # Verify no serialization issues
            if result["cases"]:
                for case in result["cases"]:
                    self.assertNotIn("_id", case, "MongoDB ObjectId still present in response")
                    
                    # Check datetime serialization
                    if "created_at" in case:
                        self.assertIsInstance(case["created_at"], str, "created_at not properly serialized to string")
                    if "updated_at" in case:
                        self.assertIsInstance(case["updated_at"], str, "updated_at not properly serialized to string")
        
        print("✅ Advanced search test passed")
        
    def test_10_complete_workflow(self):
        """Test the complete enhanced workflow"""
        print("\n=== Testing Complete Enhanced Workflow ===")
        
        # 1. Create a case with complex patient data
        print("1. Creating a case with complex patient data")
        payload = {
            "patient_summary": "67-year-old female with diabetes presents with acute chest pain, elevated troponin levels, and shortness of breath. History of hypertension and smoking.",
            "doctor_id": "test_doctor"
        }
        
        response = requests.post(f"{API_URL}/cases", json=payload)
        self.assertEqual(response.status_code, 200)
        workflow_case = response.json()
        workflow_case_id = workflow_case["id"]
        print(f"Created case with ID: {workflow_case_id}")
        
        # 2. Upload multiple files
        print("\n2. Uploading multiple files")
        files = []
        temp_paths = []
        
        # Create temporary files
        file_contents = [
            {
                "name": "ecg_results.txt",
                "content": b"ECG Results: ST elevation in leads V1-V4. Possible anterior wall MI.",
                "type": "text/plain"
            },
            {
                "name": "lab_results.txt",
                "content": b"Lab Results: Troponin I: 2.3 ng/mL (elevated). WBC: 12,000/uL. Glucose: 180 mg/dL.",
                "type": "text/plain"
            }
        ]
        
        try:
            for file_info in file_contents:
                with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
                    temp.write(file_info["content"])
                    temp_path = temp.name
                    temp_paths.append(temp_path)
                    files.append(('files', (file_info["name"], open(temp_path, 'rb'), file_info["type"])))
            
            response = requests.post(
                f"{API_URL}/cases/{workflow_case_id}/upload",
                files=files
            )
            
            self.assertEqual(response.status_code, 200)
            upload_result = response.json()
            self.assertEqual(len(upload_result["files"]), 2)
            print(f"Successfully uploaded {len(upload_result['files'])} files")
            
        finally:
            # Close file handles
            for file_tuple in files:
                file_tuple[1][1].close()
                
            # Clean up temporary files
            for temp_path in temp_paths:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        
        # 3. Analyze with Gemini
        print("\n3. Analyzing case with Gemini")
        response = requests.post(f"{API_URL}/cases/{workflow_case_id}/analyze")
        self.assertEqual(response.status_code, 200)
        analysis_result = response.json()
        self.assertIn("soap_note", analysis_result)
        self.assertIn("differential_diagnoses", analysis_result)
        print("Successfully analyzed case with Gemini")
        
        # 4. Submit feedback
        print("\n4. Submitting feedback")
        feedback_payload = {
            "case_id": workflow_case_id,
            "doctor_id": "test_doctor",
            "feedback_type": "positive",
            "feedback_text": "Excellent analysis with accurate differential diagnoses."
        }
        
        response = requests.post(f"{API_URL}/cases/{workflow_case_id}/feedback", json=feedback_payload)
        self.assertEqual(response.status_code, 200)
        print("Successfully submitted feedback")
        
        # 5. Search for the case using advanced filters
        print("\n5. Searching for the case using advanced filters")
        search_payload = {
            "doctor_id": "test_doctor",
            "search_text": "diabetes chest pain",
            "has_files": True
        }
        
        response = requests.post(f"{API_URL}/cases/search", json=search_payload)
        self.assertEqual(response.status_code, 200)
        search_result = response.json()
        self.assertIn("cases", search_result)
        
        # Check if our workflow case is in the results
        found_case = False
        for case in search_result["cases"]:
            if case["id"] == workflow_case_id:
                found_case = True
                break
                
        self.assertTrue(found_case, "Workflow case not found in search results")
        print("Successfully found case using advanced search")
        
        # 6. Query the case using natural language
        print("\n6. Querying the case using natural language")
        query_payload = {
            "query": "Show cases with chest pain and diabetes",
            "doctor_id": "test_doctor"
        }
        
        response = requests.post(f"{API_URL}/query", json=query_payload)
        self.assertEqual(response.status_code, 200)
        query_result = response.json()
        self.assertIn("response", query_result)
        self.assertIn("cases", query_result)
        
        # Check if our workflow case is in the results
        found_case = False
        for case in query_result["cases"]:
            if case["id"] == workflow_case_id:
                found_case = True
                break
                
        self.assertTrue(found_case, "Workflow case not found in query results")
        print("Successfully queried case using natural language")
        
        print("✅ Complete enhanced workflow test passed")

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)