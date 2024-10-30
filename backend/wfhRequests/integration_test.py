import unittest
import requests_mock
import requests
import json

class TestWFHModalIntegration(unittest.TestCase):
    def setUp(self):
        self.user = {
            "staff_id": "123456",
            "staff_fname": "John",
            "staff_lname": "Doe",
            "reporting_manager": "678900",
            "dept": "IT"
        }
        
        self.formData = {
            "requester_id": self.user["staff_id"],
            "reporting_manager": self.user["reporting_manager"],
            "department": self.user["dept"],
            "entries": [{"entry_date": "2024-11-01", "duration": "Full Day", "reason": "Home renovation"}],
        }

    #first step: get reporting manager information
    @requests_mock.Mocker()
    def test_fetch_reporting_manager_name(self, mocker):
        mocker.get(
            'https://scrumdaddybackend.studio/employees/',
            json={
                "data": [
                    {"staff_fname": "Jane", "staff_lname": "Smith"}
                ]
            }
        )

        # Simulate an API call that `WFHModal.js` would make
        response = requests.get('https://scrumdaddybackend.studio/employees/')
        data = response.json()

        # Check if the mock data for the manager's name is returned correctly
        manager_name = f"{data['data'][0]['staff_fname']} {data['data'][0]['staff_lname']}"
        self.assertEqual(manager_name, "Jane Smith")

    #second step: check existing requests and any approved leaves 
    @requests_mock.Mocker()
    def test_check_existing_requests_and_leaves(self, mocker):
        mocker.get(
            f'https://scrumdaddybackend.studio/wfhRequests/staff/{self.user["staff_id"]}',
            json={
                "data": [
                    {"requester_id": self.user["staff_id"], "entries": [{"entry_date": "2024-11-01", "status": "Approved"}]}
                ]
            }
        )

        mocker.get(
            f'https://scrumdaddybackend.studio/leaves/staff/{self.user["staff_id"]}',
            json={
                "data": [
                    {"leave_date": "2024-11-02"}
                ]
            }
        )

        #simulate API calls that `WFHModal.js` would make
        wfh_response = requests.get(f'https://scrumdaddybackend.studio/wfhRequests/staff/{self.user["staff_id"]}')
        leave_response = requests.get(f'https://scrumdaddybackend.studio/leaves/staff/{self.user["staff_id"]}')

        wfh_data = wfh_response.json()
        leave_data = leave_response.json()

        #check if submission is allowed 
        existing_dates = [entry["entry_date"] for entry in wfh_data["data"][0]["entries"]]
        leave_dates = [leave["leave_date"] for leave in leave_data["data"]]
        
        #suppose we want to submit for "2024-11-01"
        submission_date = "2024-11-01"
        is_submission_allowed = submission_date not in existing_dates and submission_date not in leave_dates

        #since "2024-11-01" is already approved for WFH, submission should not be allowed
        self.assertFalse(is_submission_allowed)

    def tearDown(self):
        pass

if __name__ == "__main__":
    unittest.main()
