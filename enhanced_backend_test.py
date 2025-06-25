#!/usr/bin/env python3
import requests
import json
import os
import tempfile
import unittest
import time
import base64
from io import BytesIO
from PIL import Image
import csv
from datetime import datetime, timedelta
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

class EnhancedClinicalInsightAPITest(unittest.TestCase):
    """Test suite for the Enhanced Clinical Insight Assistant API"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test data and user account for all tests"""
        # Generate a unique username to avoid conflicts
        timestamp = int(time.time())
        cls.test_username = f"testdoctor_{timestamp}"
        cls.test_email = f"doctor_{timestamp}@example.com"
        cls.test_password = "SecurePassword123!"
        
        # Register a test doctor account
        register_payload = {
            "username": cls.test_username,
            "email": cls.test_email,
            "password": cls.test_password,
            "full_name": "Dr. Test Doctor",
            "medical_license": "MD12345",
            "specialization": "Internal Medicine",
            "years_of_experience": 10,
            "hospital_affiliation": "Test Hospital",
            "phone_number": "555-123-4567"
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=register_payload)
        if response.status_code != 200:
            print(f"Failed to register test doctor: {response.text}")
            raise Exception("Test setup failed: Could not register test doctor")
        
        # Login to get session token
        login_payload = {
            "username": cls.test_username,
            "password": cls.test_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        if response.status_code != 200:
            print(f"Failed to login test doctor: {response.text}")
            raise Exception("Test setup failed: Could not login test doctor")
        
        login_data = response.json()
        cls.session_token = login_data["session_token"]
        cls.doctor_id = login_data["user"]["id"]
        
        print(f"Test doctor registered and logged in. Session token: {cls.session_token[:10]}...")
    
    def setUp(self):
        """Set up test data for each test"""
        self.sample_patient_data = {
            "patient_summary": "45-year-old male presents with chest pain, shortness of breath, and fatigue for 3 days. No previous cardiac history. Vital signs: BP 140/90, HR 95, RR 18, Temp 98.6F",
            "patient_id": f"PT{random.randint(10000, 99999)}",
            "patient_name": "John Smith",
            "patient_age": 45,
            "patient_gender": "Male",
            "patient_dob": "1978-05-15",
            "patient_address": "123 Main St, Anytown, USA",
            "emergency_contact": "Jane Smith (Wife) 555-987-6543",
            "doctor_id": self.__class__.doctor_id,
            "doctor_name": "Dr. Test Doctor"
        }
        
        self.invalid_patient_data = {
            "patient_summary": "Patient with missing required fields",
            # Missing patient_id, patient_name, patient_age, patient_gender
            "doctor_id": self.__class__.doctor_id
        }
    
    def create_test_files(self):
        """Create test files of different types for upload testing"""
        test_files = []
        temp_paths = []
        
        # Create a PDF file
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            pdf_buffer = BytesIO()
            c = canvas.Canvas(pdf_buffer, pagesize=letter)
            c.drawString(100, 750, "Test PDF Document")
            c.drawString(100, 700, "Patient: John Smith")
            c.drawString(100, 650, "Lab Results: Normal")
            c.save()
            
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp:
                temp.write(pdf_buffer.getvalue())
                temp_path = temp.name
                temp_paths.append(temp_path)
                test_files.append(('files', ('test_results.pdf', open(temp_path, 'rb'), 'application/pdf')))
        except Exception as e:
            print(f"Error creating PDF file: {str(e)}")
        
        # Create a CSV file
        try:
            with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp:
                csv_writer = csv.writer(temp)
                csv_writer.writerow(["Test", "Result", "Reference Range", "Units"])
                csv_writer.writerow(["Hemoglobin", "14.2", "13.5-17.5", "g/dL"])
                csv_writer.writerow(["White Blood Cells", "7.5", "4.5-11.0", "10^3/uL"])
                csv_writer.writerow(["Platelets", "250", "150-450", "10^3/uL"])
                temp_path = temp.name
                temp_paths.append(temp_path)
                test_files.append(('files', ('lab_results.csv', open(temp_path, 'rb'), 'text/csv')))
        except Exception as e:
            print(f"Error creating CSV file: {str(e)}")
        
        # Create a JPG image
        try:
            img = Image.new('RGB', (100, 100), color='red')
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp:
                img.save(temp, format='JPEG')
                temp_path = temp.name
                temp_paths.append(temp_path)
                test_files.append(('files', ('xray_image.jpg', open(temp_path, 'rb'), 'image/jpeg')))
        except Exception as e:
            print(f"Error creating JPG file: {str(e)}")
        
        # Create a PNG image
        try:
            img = Image.new('RGB', (100, 100), color='blue')
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp:
                img.save(temp, format='PNG')
                temp_path = temp.name
                temp_paths.append(temp_path)
                test_files.append(('files', ('mri_scan.png', open(temp_path, 'rb'), 'image/png')))
        except Exception as e:
            print(f"Error creating PNG file: {str(e)}")
        
        return test_files, temp_paths
    
    def test_01_enhanced_patient_case_creation(self):
        """Test enhanced patient case creation with required fields validation"""
        print("\n=== Testing Enhanced Patient Case Creation ===")
        
        # Test with valid data (all required fields)
        print("Testing case creation with valid data (all required fields)")
        response = requests.post(f"{API_URL}/cases", json=self.sample_patient_data)
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        case_data = response.json()
        self.assertIn("id", case_data)
        self.assertEqual(case_data["patient_id"], self.sample_patient_data["patient_id"])
        self.assertEqual(case_data["patient_name"], self.sample_patient_data["patient_name"])
        self.assertEqual(case_data["patient_age"], self.sample_patient_data["patient_age"])
        self.assertEqual(case_data["patient_gender"], self.sample_patient_data["patient_gender"])
        self.assertEqual(case_data["doctor_id"], self.sample_patient_data["doctor_id"])
        self.assertEqual(case_data["doctor_name"], self.sample_patient_data["doctor_name"])
        
        # Save case ID for subsequent tests
        self.__class__.case_id = case_data["id"]
        print(f"✅ Case created successfully with ID: {self.__class__.case_id}")
        
        # Test with invalid data (missing required fields)
        print("\nTesting case creation with invalid data (missing required fields)")
        response = requests.post(f"{API_URL}/cases", json=self.invalid_patient_data)
        print(f"Response status: {response.status_code}")
        
        # Should fail with 422 Unprocessable Entity (validation error)
        self.assertEqual(response.status_code, 422)
        error_data = response.json()
        self.assertIn("detail", error_data)
        
        # Check that the error message mentions the missing required fields
        error_detail = str(error_data["detail"])
        self.assertTrue(any(field in error_detail for field in ["patient_id", "patient_name", "patient_age", "patient_gender"]))
        print("✅ Validation correctly rejected case with missing required fields")
    
    def test_02_file_upload_multiple_types(self):
        """Test file upload functionality with multiple file types"""
        if not hasattr(self.__class__, 'case_id'):
            self.skipTest("Case ID not available. Skipping file upload test.")
            
        print("\n=== Testing File Upload with Multiple File Types ===")
        
        # Create test files of different types
        test_files, temp_paths = self.create_test_files()
        
        try:
            # Upload all files
            print(f"Uploading {len(test_files)} files of different types")
            response = requests.post(
                f"{API_URL}/cases/{self.__class__.case_id}/upload",
                files=test_files
            )
            
            print(f"Response status: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn("message", response_data)
            self.assertIn("files", response_data)
            self.assertEqual(len(response_data["files"]), len(test_files))
            
            # Verify each file was uploaded correctly
            for i, file_info in enumerate(response_data["files"]):
                self.assertIn("id", file_info)
                self.assertIn("original_name", file_info)
                self.assertIn("mime_type", file_info)
                print(f"File {i+1}: {file_info['original_name']} ({file_info['mime_type']}) uploaded successfully")
            
            # Save uploaded files info for later tests
            self.__class__.uploaded_files = response_data["files"]
            print(f"✅ Successfully uploaded {len(test_files)} files of different types")
            
        finally:
            # Close file handles
            for file_tuple in test_files:
                try:
                    file_tuple[1][1].close()
                except:
                    pass
                
            # Clean up temporary files
            for temp_path in temp_paths:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
    
    def test_03_doctor_profile_management(self):
        """Test doctor profile management endpoints"""
        print("\n=== Testing Doctor Profile Management ===")
        
        # Test GET /api/profile
        print("Testing GET /api/profile endpoint")
        response = requests.get(f"{API_URL}/profile?session_token={self.__class__.session_token}")
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        profile_data = response.json()
        self.assertIn("medical_license", profile_data)
        self.assertIn("specialization", profile_data)
        self.assertIn("years_of_experience", profile_data)
        self.assertIn("hospital_affiliation", profile_data)
        self.assertIn("phone_number", profile_data)
        self.assertIn("full_name", profile_data)
        self.assertIn("email", profile_data)
        
        # Verify profile data matches registration data
        self.assertEqual(profile_data["medical_license"], "MD12345")
        self.assertEqual(profile_data["specialization"], "Internal Medicine")
        self.assertEqual(profile_data["years_of_experience"], 10)
        self.assertEqual(profile_data["hospital_affiliation"], "Test Hospital")
        self.assertEqual(profile_data["phone_number"], "555-123-4567")
        self.assertEqual(profile_data["full_name"], "Dr. Test Doctor")
        self.assertEqual(profile_data["email"], self.__class__.test_email)
        
        print("✅ Successfully retrieved doctor profile")
        
        # Test PUT /api/profile
        print("\nTesting PUT /api/profile endpoint")
        update_payload = {
            "specialization": "Cardiology",
            "years_of_experience": 12,
            "hospital_affiliation": "Heart Center",
            "bio": "Specialized in treating cardiovascular diseases with over 10 years of experience."
        }
        
        response = requests.put(
            f"{API_URL}/profile?session_token={self.__class__.session_token}",
            json=update_payload
        )
        print(f"Response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        update_result = response.json()
        self.assertIn("message", update_result)
        self.assertIn("updated_fields", update_result)
        self.assertEqual(len(update_result["updated_fields"]), len(update_payload))
        
        # Verify profile was updated by getting it again
        response = requests.get(f"{API_URL}/profile?session_token={self.__class__.session_token}")
        self.assertEqual(response.status_code, 200)
        updated_profile = response.json()
        
        # Check that fields were updated
        self.assertEqual(updated_profile["specialization"], update_payload["specialization"])
        self.assertEqual(updated_profile["years_of_experience"], update_payload["years_of_experience"])
        self.assertEqual(updated_profile["hospital_affiliation"], update_payload["hospital_affiliation"])
        self.assertEqual(updated_profile["bio"], update_payload["bio"])
        
        print("✅ Successfully updated doctor profile")
        
        # Test authentication requirement
        print("\nTesting authentication requirement for profile endpoints")
        
        # Test with invalid session token
        invalid_token = "invalid_token_12345"
        
        # Try GET with invalid token
        response = requests.get(f"{API_URL}/profile?session_token={invalid_token}")
        self.assertEqual(response.status_code, 401)
        
        # Try PUT with invalid token
        response = requests.put(
            f"{API_URL}/profile?session_token={invalid_token}",
            json={"specialization": "Test"}
        )
        self.assertEqual(response.status_code, 401)
        
        print("✅ Profile endpoints correctly require authentication")
    
    def test_04_pdf_generation(self):
        """Test enhanced PDF generation with improved SOAP notes formatting"""
        if not hasattr(self.__class__, 'case_id'):
            self.skipTest("Case ID not available. Skipping PDF generation test.")
            
        print("\n=== Testing Enhanced PDF Generation ===")
        
        # First, ensure the case has analysis results
        print("Checking if case has analysis results")
        response = requests.get(f"{API_URL}/cases/{self.__class__.case_id}")
        case = response.json()
        
        if not case.get("analysis_result"):
            print("Case doesn't have analysis results. Running analysis first.")
            response = requests.post(f"{API_URL}/cases/{self.__class__.case_id}/analyze")
            self.assertEqual(response.status_code, 200)
            print("Analysis completed")
        
        # Test PDF export
        print("Testing PDF export with enhanced SOAP notes formatting")
        response = requests.get(f"{API_URL}/cases/{self.__class__.case_id}/export-pdf")
        print(f"PDF export response status: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/pdf")
        self.assertIn("Content-Disposition", response.headers)
        
        # Check if we got actual PDF content
        self.assertTrue(len(response.content) > 0)
        self.assertTrue(response.content.startswith(b'%PDF'))
        
        # Save PDF for inspection
        pdf_path = f"/tmp/case_{self.__class__.case_id[:8]}_report.pdf"
        with open(pdf_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Successfully generated PDF with enhanced formatting. Saved to {pdf_path}")
        print("Note: PDF content cannot be automatically verified, but the file was generated successfully.")
    
    def test_05_natural_language_query(self):
        """Test natural language query functionality with complex medical queries"""
        print("\n=== Testing Natural Language Query with Complex Medical Queries ===")
        
        # Test a variety of complex medical queries
        test_queries = [
            {
                "name": "Symptom-based query",
                "query": "Show me patients with chest pain and shortness of breath"
            },
            {
                "name": "Diagnosis-based query",
                "query": "Find cases with suspected myocardial infarction"
            },
            {
                "name": "Lab value query",
                "query": "Patients with elevated troponin levels"
            },
            {
                "name": "Demographic query",
                "query": "Male patients over 40 with cardiac symptoms"
            },
            {
                "name": "Combined complex query",
                "query": "Show me high confidence cases from yesterday with chest pain and abnormal ECG findings"
            }
        ]
        
        for test in test_queries:
            print(f"\nTesting query: {test['name']}")
            print(f"Query text: '{test['query']}'")
            
            payload = {
                "query": test["query"],
                "doctor_id": self.__class__.doctor_id
            }
            
            response = requests.post(f"{API_URL}/query", json=payload)
            print(f"Response status: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn("response", result)
            self.assertIn("cases", result)
            self.assertIn("query_analysis", result)
            
            # Verify query analysis structure
            query_analysis = result["query_analysis"]
            self.assertIn("query_type", query_analysis)
            
            # Print query analysis for inspection
            print(f"Query type: {query_analysis['query_type']}")
            if "medical_terms" in query_analysis:
                print(f"Medical terms extracted: {', '.join(query_analysis['medical_terms'])}")
            
            # Check for serialization issues
            if result["cases"]:
                for case in result["cases"]:
                    self.assertNotIn("_id", case, "MongoDB ObjectId still present in response")
                    
                    # Check datetime serialization
                    if "created_at" in case:
                        self.assertIsInstance(case["created_at"], str, "created_at not properly serialized to string")
                    if "updated_at" in case:
                        self.assertIsInstance(case["updated_at"], str, "updated_at not properly serialized to string")
            
            print(f"Found {len(result['cases'])} matching cases")
            print(f"Response: {result['response'][:100]}...")
        
        print("✅ Natural language query functionality works correctly with complex medical queries")
    
    def test_06_core_functionality(self):
        """Verify all existing core functionality still works"""
        print("\n=== Verifying Core Functionality ===")
        
        # Test authentication (already tested in setup, but verify again)
        print("Testing authentication")
        login_payload = {
            "username": self.__class__.test_username,
            "password": self.__class__.test_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 200)
        login_data = response.json()
        self.assertIn("session_token", login_data)
        print("✅ Authentication works correctly")
        
        # Test case retrieval
        print("\nTesting case retrieval")
        response = requests.get(f"{API_URL}/cases?doctor_id={self.__class__.doctor_id}")
        self.assertEqual(response.status_code, 200)
        cases = response.json()
        self.assertIsInstance(cases, list)
        self.assertTrue(len(cases) > 0)
        print(f"✅ Successfully retrieved {len(cases)} cases")
        
        # Test case search
        print("\nTesting case search")
        search_payload = {
            "doctor_id": self.__class__.doctor_id,
            "search_text": "chest pain"
        }
        
        response = requests.post(f"{API_URL}/cases/search", json=search_payload)
        self.assertEqual(response.status_code, 200)
        search_result = response.json()
        self.assertIn("cases", search_result)
        print(f"✅ Successfully searched cases, found {len(search_result['cases'])} matches")
        
        # Test feedback system
        if hasattr(self.__class__, 'case_id'):
            print("\nTesting feedback system")
            feedback_payload = {
                "case_id": self.__class__.case_id,
                "doctor_id": self.__class__.doctor_id,
                "feedback_type": "positive",
                "feedback_text": "The analysis was very helpful and accurate."
            }
            
            response = requests.post(f"{API_URL}/cases/{self.__class__.case_id}/feedback", json=feedback_payload)
            self.assertEqual(response.status_code, 200)
            
            # Check feedback stats
            response = requests.get(f"{API_URL}/feedback/stats?doctor_id={self.__class__.doctor_id}")
            self.assertEqual(response.status_code, 200)
            stats = response.json()
            self.assertIn("positive_feedback", stats)
            self.assertGreaterEqual(stats["positive_feedback"], 1)
            print("✅ Feedback system works correctly")
        
        print("\n✅ All core functionality is working correctly")
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        # Logout if we have a session token
        if hasattr(cls, 'session_token'):
            try:
                requests.post(f"{API_URL}/auth/logout?session_token={cls.session_token}")
                print(f"Logged out test doctor {cls.test_username}")
            except:
                pass

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)