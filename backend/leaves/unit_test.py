import unittest
from unittest.mock import patch, MagicMock
from app import app, AnnualLeave
import json
from datetime import datetime

class LeavesServiceTestCase(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()

        self.sample_data = {
            "employee_id": 171009,
            "leave_date": "2024-10-31",
            "department": "Finance"
        }

    def tearDown(self):
        self.app_context.pop()

    def test_healthcheck(self):
        # Send a GET request to the health check endpoint
        response = self.app.get('/leaves/healthcheck')
        
        # Assert the status code is 200
        self.assertEqual(response.status_code, 200)
        
        # Assert the JSON response data
        self.assertEqual(response.get_json(), {"message": "leaves service reached"})

    def test_get_all_leaves(self):
        response = self.app.get('/leaves')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        
    def test_get_leaves_by_staff_id(self):
        staff_id = 140003 
        response = self.app.get(f'/leaves/staff/{staff_id}')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        
        # If there are leave records, ensure fields exist
        if len(data['data']) > 0:
            first_record = data['data'][0]
            self.assertIn('employee_id', first_record)
            self.assertIn('leave_date', first_record)
            self.assertIn('department', first_record)
        
    @patch('app.db.session.query')  # Mock the query method to control return values
    def test_get_leaves_by_staff_id_no_leaves(self, mock_query):
        staff_id = 140004  # An ID that has no leaves

        # Mock the query to return an empty list for the specified staff ID
        mock_query.return_value.filter.return_value.all.return_value = []

        # Simulate GET request to /leaves/staff/<staff_id>
        response = self.app.get(f'/leaves/staff/{staff_id}')

        # Assert that the response status code is 200
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        
        # Check the structure of the response
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 0)  # Ensure the data list is empty
        self.assertIn('message', data)
        self.assertEqual(data['message'], "Annual Leave Requests By Staff ID")
        self.assertEqual(data['status_code'], 200)


    def test_get_leaves_by_date(self):
        entry_date = '2024-11-07'
        response = self.app.get(f'/leaves/date/{entry_date}')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        
        # Validate the structure of each record
        for record in data['data']:
            self.assertIn('employee_id', record)
            self.assertIn('leave_date', record)
            self.assertIn('department', record)

    @patch('app.db.session')
    def test_create_annual_leave_request(self, mock_db_session):
        # Mock the database commit
        mock_db_session.commit = MagicMock()
        mock_db_session.add = MagicMock()

        # Mock the AnnualLeave object creation
        mock_annual_leave = AnnualLeave(employee_id=1, department="Finance", leave_date="2024-10-31")
        mock_annual_leave.leave_id = 1

        # Simulate POST request to /leaves/addAnnualLeave
        response = self.app.post(
            '/leaves/addAnnualLeave',
            data=json.dumps(self.sample_data),
            content_type='application/json'
        )

        # Assert that the response status code is 201 (created)
        self.assertEqual(response.status_code, 201)

        # Assert that the mock methods were called
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

        # Assert the response message and data
        response_data = json.loads(response.data)
        self.assertEqual(response_data["status_code"], 201)
        self.assertEqual(response_data["message"], "Annual Leave Request created")
        self.assertEqual(response_data["data"]["employee_id"], 171009)  # Check if the employee_id is correct
        self.assertEqual(response_data["data"]["department"], "Finance")  # Check if the department is correct
        self.assertEqual(response_data["data"]["leave_date"], "2024-10-31")  # Check if the leave_date is correct


    @patch('app.db.session') 
    def test_delete_leave(self, mock_session):
        mock_leave = MagicMock()
        mock_session.get.return_value = mock_leave
        
        response = self.app.delete('/leaves/2')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "Leave Request with ID 2 deleted successfully")
        
        mock_session.delete.assert_called_with(mock_leave)
        mock_session.commit.assert_called()

    

if __name__ == "__main__":
    unittest.main()
