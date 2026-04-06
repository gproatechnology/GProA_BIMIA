import requests
import sys
import json
from datetime import datetime
import os

class ElectricalCopilotTester:
    def __init__(self, base_url="https://circuit-analyzer-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.document_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "name": "Test Electrical Project",
            "type": "industrial"
        }
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Created project ID: {self.project_id}")
        return success

    def test_get_projects(self):
        """Test getting all projects"""
        return self.run_test("Get Projects", "GET", "projects", 200)

    def test_get_project_by_id(self):
        """Test getting specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        return self.run_test(
            "Get Project by ID",
            "GET",
            f"projects/{self.project_id}",
            200
        )

    def test_upload_document(self):
        """Test document upload"""
        if not self.project_id:
            print("❌ No project ID available for document upload")
            return False

        # Use the test PDF file
        pdf_path = "/tmp/test_electrical_project.pdf"
        if not os.path.exists(pdf_path):
            print(f"❌ Test PDF not found at {pdf_path}")
            return False

        try:
            with open(pdf_path, 'rb') as f:
                files = {'file': ('test_electrical_project.pdf', f, 'application/pdf')}
                success, response = self.run_test(
                    "Upload Document",
                    "POST",
                    f"projects/{self.project_id}/upload",
                    200,
                    files=files
                )
                if success and 'id' in response:
                    self.document_id = response['id']
                    print(f"   Uploaded document ID: {self.document_id}")
                return success
        except Exception as e:
            print(f"❌ Error uploading file: {e}")
            return False

    def test_get_project_documents(self):
        """Test getting project documents"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        return self.run_test(
            "Get Project Documents",
            "GET",
            f"projects/{self.project_id}/documents",
            200
        )

    def test_get_project_analysis(self):
        """Test getting project analysis"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Project Analysis",
            "GET",
            f"projects/{self.project_id}/analysis",
            200
        )
        
        # Check if analysis is in progress or completed
        if success:
            if response.get('summary') == "Análisis en proceso...":
                print("   ⏳ Analysis is still in progress")
            else:
                print("   ✅ Analysis completed")
                if response.get('errors'):
                    print(f"   Found {len(response['errors'])} errors")
                if response.get('warnings'):
                    print(f"   Found {len(response['warnings'])} warnings")
        
        return success

    def test_send_chat_message(self):
        """Test sending a chat message"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False

        chat_data = {
            "content": "¿Qué errores encontraste en este proyecto eléctrico?"
        }
        
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            f"projects/{self.project_id}/chat",
            200,
            data=chat_data
        )
        
        if success and response.get('content'):
            print(f"   AI Response: {response['content'][:100]}...")
        
        return success

    def test_get_chat_history(self):
        """Test getting chat history"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Chat History",
            "GET",
            f"projects/{self.project_id}/chat/history",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} chat messages")
        
        return success

    def wait_for_analysis(self, max_attempts=6):
        """Wait for analysis to complete"""
        if not self.project_id:
            return False
        
        print("\n⏳ Waiting for analysis to complete...")
        import time
        
        for attempt in range(max_attempts):
            print(f"   Attempt {attempt + 1}/{max_attempts}")
            success, response = self.run_test(
                f"Check Analysis Status (Attempt {attempt + 1})",
                "GET",
                f"projects/{self.project_id}/analysis",
                200
            )
            
            if success and response.get('summary') != "Análisis en proceso...":
                print("   ✅ Analysis completed!")
                return True
            
            if attempt < max_attempts - 1:
                print("   ⏳ Still processing, waiting 10 seconds...")
                time.sleep(10)
        
        print("   ⚠️ Analysis did not complete within expected time")
        return False

def main():
    print("🚀 Starting Electrical Copilot API Tests")
    print("=" * 50)
    
    tester = ElectricalCopilotTester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Create Project", tester.test_create_project),
        ("Get Projects", tester.test_get_projects),
        ("Get Project by ID", tester.test_get_project_by_id),
        ("Upload Document", tester.test_upload_document),
        ("Get Project Documents", tester.test_get_project_documents),
    ]
    
    # Run basic tests
    for test_name, test_func in tests:
        if not test_func():
            print(f"\n❌ Critical test failed: {test_name}")
            print("Stopping test execution")
            break
    else:
        # Wait for analysis to complete
        if tester.wait_for_analysis():
            # Test analysis and chat features
            tester.test_get_project_analysis()
            tester.test_send_chat_message()
            tester.test_get_chat_history()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())