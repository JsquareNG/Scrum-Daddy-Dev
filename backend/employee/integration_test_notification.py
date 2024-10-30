import unittest
from unittest.mock import patch, Mock
import requests

class TestNotificationIntegration(unittest.TestCase):

    @patch('requests.get')
    def test_get_employee_by_staff_id(self, mock_get):
        # Define a mock response for getEmployeeByStaffID
        mock_response = Mock()
        mock_response.json.return_value = {
            "data": [{"staff_id": 140894, "staff_fname": "Rahim", "position": "Sales Manager"}]
        }
        mock_get.return_value = mock_response

        # Simulate call to `https://scrumdaddybackend.studio/employees/`
        staff_id = 140894
        response = requests.get("https://scrumdaddybackend.studio/employees/", params={'staff_id': staff_id})

        # Check if the request was made with correct parameters
        mock_get.assert_called_once_with("https://scrumdaddybackend.studio/employees/", params={'staff_id': staff_id})

        # Validate response processing
        self.assertEqual(response.json()['data'][0]['staff_fname'], 'Rahim')

    @patch('requests.get')
    def test_get_all_notifications(self, mock_get):
        # Define a mock response for WFH requests
        mock_response = Mock()
        mock_response.json.return_value = {
            "data": [
                {
                    "requester_id": 140894,
                    "reporting_manager": 140001,
                    "last_notification_status": "Delivered",
                    "request_id": "1"
                }
            ]
        }
        mock_get.return_value = mock_response

        # Simulate call to `https://scrumdaddybackend.studio/wfhRequests/getAll/{user.staff_id}`
        user_staff_id = "140894"
        response = requests.get(f"https://scrumdaddybackend.studio/wfhRequests/getAll/{user_staff_id}")

        # Check if the request was made with correct parameters
        mock_get.assert_called_once_with(f"https://scrumdaddybackend.studio/wfhRequests/getAll/{user_staff_id}")

        # Validate response processing
        notifications = response.json()['data']
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0]['request_id'], '1')

    @patch('requests.get')
    def test_get_delegation_notifications(self, mock_get):
        # Define a mock response for delegation notifications
        mock_response = Mock()
        mock_response.json.return_value = {
            "data": [
                {
                    "delegate_from": 140894,
                    "delegate_to": 140008,
                    "status": "accepted",
                    "delegate_id": "1"
                }
            ]
        }
        mock_get.return_value = mock_response

        # Simulate call to `https://scrumdaddybackend.studio/employees/getAllDeleNoti/{user.staff_id}`
        user_staff_id = "140894"
        response = requests.get(f"https://scrumdaddybackend.studio/employees/getAllDeleNoti/{user_staff_id}")

        # Check if the request was made with correct parameters
        mock_get.assert_called_once_with(f"https://scrumdaddybackend.studio/employees/getAllDeleNoti/{user_staff_id}")

        # Validate response processing
        notifications = response.json()['data']
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0]['delegate_id'], '1')

if __name__ == '__main__':
    unittest.main()
