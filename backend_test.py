#!/usr/bin/env python3
"""
HealthHub Backend API Comprehensive Test Suite
Tests all authentication, medicine management, family, and analytics endpoints
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import sys

# Configuration
BASE_URL = "https://med-assistant-8.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class HealthHubAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.test_users = []
        self.test_medicines = []
        self.auth_tokens = {}
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_token: Optional[str] = None) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test data for multiple users
        test_users_data = [
            {
                "email": f"sarah.johnson.{uuid.uuid4().hex[:8]}@healthhub.com",
                "password": "SecurePass123!",
                "full_name": "Sarah Johnson",
                "phone": "+1-555-0123",
                "blood_type": "O+",
                "allergies": ["Penicillin", "Shellfish"],
                "emergency_contacts": [
                    {"name": "John Johnson", "phone": "+1-555-0124", "relationship": "Spouse"}
                ]
            },
            {
                "email": f"mike.davis.{uuid.uuid4().hex[:8]}@healthhub.com", 
                "password": "MyPassword456!",
                "full_name": "Mike Davis",
                "phone": "+1-555-0125",
                "blood_type": "A-",
                "allergies": ["Latex"],
                "emergency_contacts": [
                    {"name": "Emma Davis", "phone": "+1-555-0126", "relationship": "Sister"}
                ]
            }
        ]
        
        for i, user_data in enumerate(test_users_data):
            try:
                response = self.make_request("POST", "/auth/register", user_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if "token" in result and "user" in result:
                        self.test_users.append(user_data)
                        self.auth_tokens[user_data["email"]] = result["token"]
                        self.log_result(f"User Registration {i+1}", True, 
                                      f"User {result['user']['full_name']} registered successfully")
                    else:
                        self.log_result(f"User Registration {i+1}", False, 
                                      "Missing token or user in response")
                else:
                    self.log_result(f"User Registration {i+1}", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result(f"User Registration {i+1}", False, f"Exception: {str(e)}")

        # Test duplicate email registration
        if self.test_users:
            try:
                duplicate_data = self.test_users[0].copy()
                response = self.make_request("POST", "/auth/register", duplicate_data)
                
                if response.status_code == 400:
                    self.log_result("Duplicate Email Validation", True, 
                                  "Correctly rejected duplicate email")
                else:
                    self.log_result("Duplicate Email Validation", False, 
                                  f"Should reject duplicate email, got status: {response.status_code}")
            except Exception as e:
                self.log_result("Duplicate Email Validation", False, f"Exception: {str(e)}")

    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        if not self.test_users:
            self.log_result("User Login", False, "No test users available")
            return
        
        for i, user_data in enumerate(self.test_users):
            try:
                login_data = {
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
                
                response = self.make_request("POST", "/auth/login", login_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if "token" in result and "user" in result:
                        # Update token (might be different from registration)
                        self.auth_tokens[user_data["email"]] = result["token"]
                        self.log_result(f"User Login {i+1}", True, 
                                      f"User {result['user']['full_name']} logged in successfully")
                    else:
                        self.log_result(f"User Login {i+1}", False, 
                                      "Missing token or user in response")
                else:
                    self.log_result(f"User Login {i+1}", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result(f"User Login {i+1}", False, f"Exception: {str(e)}")

        # Test invalid credentials
        try:
            invalid_login = {
                "email": self.test_users[0]["email"],
                "password": "WrongPassword123!"
            }
            
            response = self.make_request("POST", "/auth/login", invalid_login)
            
            if response.status_code == 401:
                self.log_result("Invalid Credentials Test", True, 
                              "Correctly rejected invalid password")
            else:
                self.log_result("Invalid Credentials Test", False, 
                              f"Should reject invalid credentials, got status: {response.status_code}")
        except Exception as e:
            self.log_result("Invalid Credentials Test", False, f"Exception: {str(e)}")

    def test_get_user_profile(self):
        """Test get current user profile endpoint"""
        print("\n=== Testing Get User Profile ===")
        
        if not self.auth_tokens:
            self.log_result("Get User Profile", False, "No auth tokens available")
            return
        
        for i, (email, token) in enumerate(self.auth_tokens.items()):
            try:
                response = self.make_request("GET", "/auth/me", auth_token=token)
                
                if response.status_code == 200:
                    user_profile = response.json()
                    if "email" in user_profile and user_profile["email"] == email:
                        self.log_result(f"Get Profile {i+1}", True, 
                                      f"Retrieved profile for {user_profile['full_name']}")
                    else:
                        self.log_result(f"Get Profile {i+1}", False, 
                                      "Profile email doesn't match expected")
                else:
                    self.log_result(f"Get Profile {i+1}", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Get Profile {i+1}", False, f"Exception: {str(e)}")

        # Test unauthorized access
        try:
            response = self.make_request("GET", "/auth/me", auth_token="invalid_token")
            
            if response.status_code == 401:
                self.log_result("Unauthorized Profile Access", True, 
                              "Correctly rejected invalid token")
            else:
                self.log_result("Unauthorized Profile Access", False, 
                              f"Should reject invalid token, got status: {response.status_code}")
        except Exception as e:
            self.log_result("Unauthorized Profile Access", False, f"Exception: {str(e)}")

    def test_medicine_crud_operations(self):
        """Test complete medicine CRUD operations"""
        print("\n=== Testing Medicine CRUD Operations ===")
        
        if not self.auth_tokens:
            self.log_result("Medicine CRUD", False, "No auth tokens available")
            return
        
        # Use first user for medicine testing
        first_email = list(self.auth_tokens.keys())[0]
        token = self.auth_tokens[first_email]
        
        # Test medicine creation
        medicine_data = [
            {
                "name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "daily",
                "instructions": "Take with food in the morning",
                "stock_quantity": 30,
                "expiry_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                "category": "blood_pressure",
                "reminders": [{"time": "08:00", "enabled": True}]
            },
            {
                "name": "Vitamin D3",
                "dosage": "2000 IU",
                "frequency": "daily",
                "instructions": "Take with largest meal",
                "stock_quantity": 60,
                "expiry_date": (datetime.utcnow() + timedelta(days=730)).isoformat(),
                "category": "vitamins",
                "reminders": [{"time": "12:00", "enabled": True}]
            }
        ]
        
        created_medicine_ids = []
        
        # CREATE medicines
        for i, medicine in enumerate(medicine_data):
            try:
                response = self.make_request("POST", "/medicines", medicine, auth_token=token)
                
                if response.status_code == 200:
                    result = response.json()
                    if "id" in result and result["name"] == medicine["name"]:
                        created_medicine_ids.append(result["id"])
                        self.test_medicines.append(result)
                        self.log_result(f"Create Medicine {i+1}", True, 
                                      f"Created {result['name']} successfully")
                    else:
                        self.log_result(f"Create Medicine {i+1}", False, 
                                      "Invalid response structure")
                else:
                    self.log_result(f"Create Medicine {i+1}", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Create Medicine {i+1}", False, f"Exception: {str(e)}")

        # READ medicines (get all)
        try:
            response = self.make_request("GET", "/medicines", auth_token=token)
            
            if response.status_code == 200:
                medicines = response.json()
                if isinstance(medicines, list) and len(medicines) >= len(created_medicine_ids):
                    self.log_result("Get All Medicines", True, 
                                  f"Retrieved {len(medicines)} medicines")
                else:
                    self.log_result("Get All Medicines", False, 
                                  f"Expected at least {len(created_medicine_ids)} medicines, got {len(medicines) if isinstance(medicines, list) else 'invalid response'}")
            else:
                self.log_result("Get All Medicines", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Get All Medicines", False, f"Exception: {str(e)}")

        # READ individual medicines
        for i, medicine_id in enumerate(created_medicine_ids):
            try:
                response = self.make_request("GET", f"/medicines/{medicine_id}", auth_token=token)
                
                if response.status_code == 200:
                    medicine = response.json()
                    if medicine["id"] == medicine_id:
                        self.log_result(f"Get Medicine {i+1}", True, 
                                      f"Retrieved {medicine['name']}")
                    else:
                        self.log_result(f"Get Medicine {i+1}", False, 
                                      "Medicine ID mismatch")
                else:
                    self.log_result(f"Get Medicine {i+1}", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Get Medicine {i+1}", False, f"Exception: {str(e)}")

        # UPDATE medicines
        if created_medicine_ids:
            try:
                medicine_id = created_medicine_ids[0]
                update_data = {
                    "name": "Lisinopril (Updated)",
                    "dosage": "20mg",
                    "frequency": "daily",
                    "instructions": "Take with food in the morning - UPDATED",
                    "stock_quantity": 25,
                    "expiry_date": (datetime.utcnow() + timedelta(days=300)).isoformat(),
                    "category": "blood_pressure",
                    "reminders": [{"time": "09:00", "enabled": True}]
                }
                
                response = self.make_request("PUT", f"/medicines/{medicine_id}", 
                                           update_data, auth_token=token)
                
                if response.status_code == 200:
                    updated_medicine = response.json()
                    if updated_medicine["name"] == update_data["name"]:
                        self.log_result("Update Medicine", True, 
                                      f"Updated medicine to {updated_medicine['name']}")
                    else:
                        self.log_result("Update Medicine", False, 
                                      "Medicine name not updated correctly")
                else:
                    self.log_result("Update Medicine", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result("Update Medicine", False, f"Exception: {str(e)}")

        # DELETE medicine
        if created_medicine_ids:
            try:
                medicine_id = created_medicine_ids[-1]  # Delete last created medicine
                response = self.make_request("DELETE", f"/medicines/{medicine_id}", auth_token=token)
                
                if response.status_code == 200:
                    result = response.json()
                    if "message" in result:
                        self.log_result("Delete Medicine", True, 
                                      "Medicine deleted successfully")
                        created_medicine_ids.remove(medicine_id)
                    else:
                        self.log_result("Delete Medicine", False, 
                                      "Invalid delete response")
                else:
                    self.log_result("Delete Medicine", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result("Delete Medicine", False, f"Exception: {str(e)}")

        # Test user isolation - try to access another user's medicine
        if len(self.auth_tokens) > 1 and created_medicine_ids:
            try:
                second_email = list(self.auth_tokens.keys())[1]
                second_token = self.auth_tokens[second_email]
                medicine_id = created_medicine_ids[0]
                
                response = self.make_request("GET", f"/medicines/{medicine_id}", 
                                           auth_token=second_token)
                
                if response.status_code == 404:
                    self.log_result("User Isolation Test", True, 
                                  "Correctly blocked access to other user's medicine")
                else:
                    self.log_result("User Isolation Test", False, 
                                  f"Should block access to other user's data, got status: {response.status_code}")
                    
            except Exception as e:
                self.log_result("User Isolation Test", False, f"Exception: {str(e)}")

    def test_family_management(self):
        """Test family management functionality"""
        print("\n=== Testing Family Management ===")
        
        if len(self.auth_tokens) < 2:
            self.log_result("Family Management", False, "Need at least 2 users for family testing")
            return
        
        emails = list(self.auth_tokens.keys())
        first_token = self.auth_tokens[emails[0]]
        second_email = emails[1]
        
        # Test family member invitation
        try:
            invite_data = {
                "invitee_email": second_email,
                "role": "family_member"
            }
            
            response = self.make_request("POST", "/family/invite", invite_data, auth_token=first_token)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_result("Family Invitation", True, 
                                  f"Invitation sent: {result['message']}")
                else:
                    self.log_result("Family Invitation", False, 
                                  "Invalid invitation response")
            else:
                self.log_result("Family Invitation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Family Invitation", False, f"Exception: {str(e)}")

        # Test get family members
        try:
            response = self.make_request("GET", "/family/members", auth_token=first_token)
            
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list):
                    self.log_result("Get Family Members", True, 
                                  f"Retrieved {len(members)} family members")
                else:
                    self.log_result("Get Family Members", False, 
                                  "Invalid family members response")
            else:
                self.log_result("Get Family Members", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Get Family Members", False, f"Exception: {str(e)}")

    def test_health_analytics(self):
        """Test health analytics endpoints"""
        print("\n=== Testing Health Analytics ===")
        
        if not self.auth_tokens:
            self.log_result("Health Analytics", False, "No auth tokens available")
            return
        
        first_email = list(self.auth_tokens.keys())[0]
        token = self.auth_tokens[first_email]
        
        # Test adherence statistics
        try:
            response = self.make_request("GET", "/analytics/adherence", auth_token=token)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["adherence_rate", "total_doses", "taken_doses", "missed_doses", "period_days"]
                if all(field in stats for field in required_fields):
                    self.log_result("Adherence Analytics", True, 
                                  f"Adherence rate: {stats['adherence_rate']}%")
                else:
                    self.log_result("Adherence Analytics", False, 
                                  f"Missing required fields in response: {stats}")
            else:
                self.log_result("Adherence Analytics", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Adherence Analytics", False, f"Exception: {str(e)}")

        # Test upcoming expiries
        try:
            response = self.make_request("GET", "/analytics/upcoming-expiries", auth_token=token)
            
            if response.status_code == 200:
                expiries = response.json()
                if isinstance(expiries, list):
                    self.log_result("Upcoming Expiries", True, 
                                  f"Found {len(expiries)} medicines expiring in next 30 days")
                else:
                    self.log_result("Upcoming Expiries", False, 
                                  "Invalid expiries response format")
            else:
                self.log_result("Upcoming Expiries", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Upcoming Expiries", False, f"Exception: {str(e)}")

    def test_error_handling(self):
        """Test error handling and validation"""
        print("\n=== Testing Error Handling ===")
        
        if not self.auth_tokens:
            self.log_result("Error Handling", False, "No auth tokens available")
            return
        
        token = list(self.auth_tokens.values())[0]
        
        # Test accessing non-existent medicine
        try:
            fake_id = str(uuid.uuid4())
            response = self.make_request("GET", f"/medicines/{fake_id}", auth_token=token)
            
            if response.status_code == 404:
                self.log_result("Non-existent Medicine", True, 
                              "Correctly returned 404 for non-existent medicine")
            else:
                self.log_result("Non-existent Medicine", False, 
                              f"Should return 404, got status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Non-existent Medicine", False, f"Exception: {str(e)}")

        # Test invalid medicine data
        try:
            invalid_medicine = {
                "name": "",  # Empty name should be invalid
                "dosage": "10mg",
                "frequency": "daily"
            }
            
            response = self.make_request("POST", "/medicines", invalid_medicine, auth_token=token)
            
            # Accept either 400 (validation error) or 422 (unprocessable entity)
            if response.status_code in [400, 422]:
                self.log_result("Invalid Medicine Data", True, 
                              "Correctly rejected invalid medicine data")
            else:
                self.log_result("Invalid Medicine Data", False, 
                              f"Should reject invalid data, got status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Invalid Medicine Data", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🏥 HealthHub Backend API Comprehensive Test Suite")
        print("=" * 60)
        
        try:
            self.test_user_registration()
            self.test_user_login()
            self.test_get_user_profile()
            self.test_medicine_crud_operations()
            self.test_family_management()
            self.test_health_analytics()
            self.test_error_handling()
            
        except Exception as e:
            print(f"\n❌ Critical test failure: {str(e)}")
            self.test_results["errors"].append(f"Critical failure: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📈 Success Rate: {(self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed']) * 100):.1f}%" if (self.test_results['passed'] + self.test_results['failed']) > 0 else "0.0%")
        
        if self.test_results['errors']:
            print(f"\n🚨 FAILED TESTS ({len(self.test_results['errors'])}):")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        return self.test_results

if __name__ == "__main__":
    print("Starting HealthHub Backend API Tests...")
    print(f"Testing against: {BASE_URL}")
    print("-" * 60)
    
    tester = HealthHubAPITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results['failed'] == 0 else 1)