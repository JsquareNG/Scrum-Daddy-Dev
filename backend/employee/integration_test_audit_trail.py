import unittest
import requests

class AuditTrailTest(unittest.TestCase):
    BASE_URL = 'https://scrumdaddybackend.studio' 

    def test_get_all_employees(self):
        response = requests.get(f'{self.BASE_URL}/employees/')
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertIsInstance(response_data, dict)
        self.assertIn('data', response_data)

        self.assertIsInstance(response_data['data'], list)  
        self.assertGreater(len(response_data['data'][1]), 0)  # Ensure there's at least one employee


    def test_get_wfh_requests(self):
        user_staff_id = '171043'  # Use a valid staff ID that exists in your database
        response = requests.get(f'{self.BASE_URL}/wfhRequests/getAll/{user_staff_id}')
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertIsInstance(response_data, dict)
        self.assertIn('data', response_data)
        self.assertIsInstance(response_data['data'], list) 
        self.assertGreater(len(response_data['data']), 0) 

        first_request = response_data['data'][0]  # Access the first WFH request
        self.assertIn('request_id', first_request)
        self.assertIn('requester_id', first_request)
        self.assertIn('notification_status', first_request)
        self.assertIn('overall_status', first_request)
        self.assertIn('department', first_request)
        self.assertIn('created_at', first_request)
        self.assertIn('modified_at', first_request)
        self.assertIn('last_notification_status', first_request)
        self.assertIn('reporting_manager', first_request)

    def test_get_deletion_notifications(self):
        user_staff_id = '171009' 
        response = requests.get(f'{self.BASE_URL}/employees/delegate/{user_staff_id}')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), dict) 

if __name__ == '__main__':
    unittest.main()
