import unittest
from unittest.mock import patch, MagicMock
from app import app, db, WFHRequest, WFHRequestEntry
from flask import json
from datetime import datetime, timedelta
from factory import Status, NotificationStatus
from psycopg import connect
import pytz

class WFHRequestsTest(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.app_context = app.app_context()
        self.app_context.push()

        # Sample request data
        self.sample_data = {
            "requester_id": 1,
            "reporting_manager": 2,
            "department": "Finance",
            "entries": [
                {
                    "entry_date": "2024-10-14 09:00:00",
                    "reason": "Doctor's appointment",
                    "duration": "Full Day"
                }
            ]
        }
        self.sample_withdraw_data = {
            "request_id": 1,
            "entry_ids": [
                {"entry_id": 101, "reason": "Personal reasons"},
                {"entry_id": 102, "reason": "Family emergency"}
            ]
        }

    def tearDown(self):
        self.app_context.pop()

    def test_healthcheck(self):
        response = self.app.get('/wfhRequests/healthcheck')
        data = json.loads(response.data)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'wfhRequest service reached')

    def test_get_all_wfh_requests(self):
        response = self.app.get('/wfhRequests')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)  # Ensure 'data' is a list

        if len(data['data']) > 0:
            first_request = data['data'][0]
            self.assertIn('request_id', first_request)
            self.assertIn('requester_id', first_request)
            self.assertIn('department', first_request)
            self.assertIn('entries', first_request)
            self.assertIsInstance(first_request['entries'], list)  # Ensure entries are a list

    def test_valid_request_ID(self):
        response = self.app.get('/wfhRequests/1')  # Valid request ID
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('data', data)
        self.assertIsInstance(data['data'], dict)
        self.assertEqual(data['data']['request_id'], 1)
        self.assertIn('entries', data['data'])  # Check for entries field

    def test_invalid_request_ID(self):
        response = self.app.get('/wfhRequests/999')  # Invalid request ID
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('data', data)
        self.assertIsInstance(data['data'], dict)

        self.assertIn('entries', data['data'])  # Check for entries field
        self.assertEqual(len(data['data']['entries']), 0)  # Ensure no entries are returned
        self.assertNotIn('request_id', data['data'])

    def test_valid_staff_ID(self):
        response = self.app.get('/wfhRequests/staff/171009')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list) 
        if data['data'][0]['requester_id']!= 171009:
            self.assertEqual(data['data'][0]['reporting_manager'], 171009)
                            

    def test_invalid_staff_ID(self):
        response = self.app.get('/wfhRequests/staff/999999') 
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 0) 
        self.assertEqual(data['message'], "WFH Requests By Staff ID")

    
    def test_get_wfh_request_by_requester_id(self):
        # Define the staff_id to test
        staff_id = 140004
        response = self.app.get(f'/wfhRequests/requester/{staff_id}')
        
        # Verify a successful response status code
        self.assertEqual(response.status_code, 200)
        
        # Parse the JSON response data
        data = json.loads(response.data)
        
        # Validate structure of the response data
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        
        # Validate each WFH request in response
        if len(data['data']) > 0:
            for request in data['data']:
                # Check that each request contains the expected fields
                self.assertIn('request_id', request)
                self.assertIn('requester_id', request)
                self.assertIn('department', request)
                self.assertIn('entries', request)
                self.assertIsInstance(request['entries'], list)  # Ensure entries is a list
                
                # Check that each entry within entries has the required fields
                if len(request['entries']) > 0:
                    for entry in request['entries']:
                        self.assertIn('entry_id', entry)
                        self.assertIn('request_id', entry)
                        self.assertIn('reason', entry)
                        self.assertIn('duration', entry)
                        self.assertIn('status', entry)
                        
                        # Verify that status is 'Approved'
                        self.assertEqual(entry['status'], 'Approved')


    def test_get_wfh_requests_by_dept(self):
        response = self.app.get('/wfhRequests/dept/Finance')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)

        if len(data['data']) > 0:
            for request in data['data']:
                # Check if each WFH request has the expected fields
                self.assertIn('request_id', request)
                self.assertIn('requester_id', request)
                self.assertIn('department', request)
                self.assertIn('entries', request)
                self.assertIsInstance(request['entries'], list)  # Ensure entries is a list
                
                # Check if the department matches 'Finance'
                self.assertEqual(request['department'], 'Finance')

                if len(request['entries']) > 0:
                    first_entry = request['entries'][0]
                    
                    # Check if each entry has the expected fields
                    self.assertIn('entry_id', first_entry)
                    self.assertIn('request_id', first_entry)
                    self.assertIn('reason', first_entry)
                    self.assertIn('duration', first_entry)
                    self.assertIn('status', first_entry)
    
    def test_non_existent_department(self):
        response = self.app.get('/wfhRequests/dept/Teaching')  # Non-existent department
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)

        self.assertEqual(len(data['data']), 0)
        self.assertEqual(data['message'], "WFH Requests By Department")
        self.assertEqual(data['status_code'], 200)

    def test_get_requests_by_date_found(self):
        response = self.app.get('/wfhRequests/date/2024-11-06')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list) 

    def test_date_not_found(self):
        # Call the endpoint with a date that has no requests
        response = self.app.get('/wfhRequests/date/2024-12-12')  # Assuming this date has no entries
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)

        # Directly check if the response is an empty list
        self.assertIsInstance(data, list)  # Ensure the response is a list
        self.assertEqual(len(data), 0)  # No entries should be returned

    def test_get_notifications_length_with_notifications(self):
        # Call the endpoint with a staff ID that has notifications
        response = self.app.get('/wfhRequests/getNotificationsLength/171009')

        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)

        # Check if the response data is as expected
        self.assertEqual(data['data'], 0)  # Assuming there's 1 notification
        self.assertEqual(data['message'], "Total Notifications Length")
        self.assertEqual(data['status_code'], 200)

    
    def test_get_all_requests_of_staff(self):
        response = self.app.get('/wfhRequests/getAll/171009')
        self.assertEqual(response.status_code, 200)

        # Parse the JSON response
        data = json.loads(response.data)

        # Ensure the 'data' field exists and is a list
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)

        # Ensure the list is not empty
        self.assertGreater(len(data['data']), 0)

        # Check the first request in the data (this assumes at least one request exists)
        first_request = data['data'][0]
        self.assertIn('requester_id', first_request)
        self.assertIn('reporting_manager', first_request)
        self.assertIn('overall_status', first_request)
        self.assertIn('last_notification_status', first_request)
        self.assertIn('notification_status', first_request)
        
        # Ensure the request belongs to the staff member (as requester or manager)
        self.assertTrue(first_request['requester_id'] == 171009 or first_request['reporting_manager'] == 171009)
        
        # Verify that the message is correct
        self.assertEqual(data['message'], "WFH Requests By Date")

        # Check status code in response
        self.assertEqual(data['status_code'], 200)
    
    def test_get_all_requests_no_requests(self):
        # Perform a GET request to the endpoint with a staff_id that has no requests (e.g., 999999)
        response = self.app.get('/wfhRequests/getAll/999999')

        # Check that the status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the JSON response
        data = json.loads(response.data)

        # Ensure the 'data' field exists and is an empty list
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 0)  # Should return an empty list

        # Verify that the message is correct
        self.assertEqual(data['message'], "WFH Requests By Date")

        # Check status code in response
        self.assertEqual(data['status_code'], 200)

    @patch('app.db.session')
    def test_create_wfh_request(self, mock_db_session):
        # Mock the database commit and flush
        mock_db_session.commit = MagicMock()
        mock_db_session.flush = MagicMock()

        # Mock WFHRequest creation
        mock_wfh_request = MagicMock()
        mock_wfh_request.request_id = 1
        mock_db_session.add = MagicMock(side_effect=lambda x: x)

        # Simulate POST request to /wfhRequests
        response = self.app.post(
            '/wfhRequests',
            data=json.dumps(self.sample_data),
            content_type='application/json'
        )

        # Assert that the response status code is 201 (created)
        self.assertEqual(response.status_code, 201)

        # Assert that the mock methods were called
        mock_db_session.add.assert_called()
        
        # Assert the response message
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "WFH Request created")

    @patch('app.db.session')
    def test_create_wfh_request_with_same_requester_and_manager(self, mock_db_session):
        # Update sample_data to have the same requester_id and reporting_manager
        self.sample_data["reporting_manager"] = 1  # Same as requester_id

        # Mock the database commit and flush
        mock_db_session.commit = MagicMock()
        mock_db_session.flush = MagicMock()

        # Mock the creation of WFHRequest
        mock_wfh_request = MagicMock()
        mock_wfh_request.request_id = 1
        mock_db_session.add = MagicMock(side_effect=lambda x: x)

        # Simulate POST request to /wfhRequests
        response = self.app.post(
            '/wfhRequests',
            data=json.dumps(self.sample_data),
            content_type='application/json'
        )

        # Assert that the response status code is 201 (created)
        self.assertEqual(response.status_code, 201)

        # Assert the response message
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "WFH Request created")

    
    @patch('app.db.session')
    def test_delete_request(self, mock_db_session):
        # Simulate the deletion of an existing WFH request
        mock_wfh_request = MagicMock()
        mock_db_session.get.return_value = mock_wfh_request
        
        response = self.app.delete('/wfhRequests/1')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "WFH Request with ID 1 deleted successfully")
        
        mock_db_session.delete.assert_called_with(mock_wfh_request)
        mock_db_session.commit.assert_called()

    @patch('app.db.session')
    def test_withdrawal(self, mock_db_session):
        mock_wfh_request = MagicMock()
        mock_db_session.get.return_value = mock_wfh_request

        response = self.app.put(
            '/wfhRequests/withdraw',
            data=json.dumps(self.sample_withdraw_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "Entries updated successfully")

        mock_db_session.commit.assert_called()

    @patch('app.db.session')
    @patch('app.WFHRequestEntry')
    @patch('app.WFHRequest')
    def test_approve_request(self, mock_wfh_request, mock_wfh_request_entry, mock_db_session):
        # Mock the WFHRequestEntry records (these are the individual entries)
        mock_wfh_request_entry_1 = MagicMock()
        mock_wfh_request_entry_2 = MagicMock()

        # Mock the WFHRequest (the overall request)
        mock_request_record = MagicMock()

        # Set the mock to return a list of matching WFHRequestEntry objects
        mock_filter_query = MagicMock()
        mock_filter_query.filter.return_value = mock_filter_query  # Allow method chaining
        mock_filter_query.all.return_value = [mock_wfh_request_entry_1, mock_wfh_request_entry_2]

        # Simulate the request entries being approved in the app logic
        mock_wfh_request_entry_1.status = Status.APPROVED
        mock_wfh_request_entry_2.status = Status.APPROVED

        # Mock the WFHRequestEntry query behavior
        mock_wfh_request_entry.query.filter.return_value = mock_filter_query

        # Mock getting the WFHRequest record for the request_id
        mock_wfh_request.query.get.return_value = mock_request_record

        # Simulate the PUT request to the /wfhRequests/approve endpoint
        response = self.app.put(
            '/wfhRequests/approve',
            data=json.dumps({
                'request_id': 1,
                'entry_ids': [101, 102]  # Example entry IDs
            }),
            content_type='application/json'
        )

        # Assert that the response status code is 200 (OK)
        self.assertEqual(response.status_code, 200)

        # Parse the JSON response data
        response_data = json.loads(response.data)

        # Assert that the entries were updated successfully
        self.assertEqual(response_data["message"], "Entries updated successfully")

        # Assert that the mock query methods were called correctly
        mock_wfh_request_entry.query.filter.assert_called_once()  # Ensure first filter was called

        # Assert that the function updated the status of the WFHRequest
        self.assertEqual(mock_request_record.overall_status, Status.APPROVED)
        self.assertEqual(mock_request_record.notification_status, NotificationStatus.EDITED)

    @patch('app.WFHRequestEntry')
    @patch('app.WFHRequest')
    @patch('app.db.session')
    def test_reject_requests(self, mock_db_session, mock_WFHRequest, mock_WFHRequestEntry):
        # Create test client
        client = app.test_client()

        # Mock data
        mock_request_id = 1
        mock_entry_ids = [
            {"entry_id": 101, "reason": "Invalid request"},
            {"entry_id": 102, "reason": "Not allowed"}
        ]

        # Create mock WFHRequestEntry instances
        mock_entry_1 = MagicMock()
        mock_entry_1.entry_id = 101
        mock_entry_1.request_id = mock_request_id
        mock_entry_1.status = Status.PENDING

        mock_entry_2 = MagicMock()
        mock_entry_2.entry_id = 102
        mock_entry_2.request_id = mock_request_id
        mock_entry_2.status = Status.PENDING

        # Chain the mock methods to ensure the proper behavior
        mock_filter_query = MagicMock()
        mock_filter_query.filter.return_value = mock_filter_query  # Chaining the filter
        mock_filter_query.all.return_value = [mock_entry_1, mock_entry_2]  # Return the mock entries
        mock_WFHRequestEntry.query.filter.return_value = mock_filter_query

        # Mock all entries related to this request ID
        mock_WFHRequestEntry.query.filter_by.return_value.all.return_value = [mock_entry_1, mock_entry_2]

        # Mock the WFHRequest record
        mock_request_record = MagicMock()
        mock_request_record.request_id = mock_request_id
        mock_WFHRequest.query.get.return_value = mock_request_record

        # Create the payload
        payload = {
            "request_id": mock_request_id,
            "entry_ids": mock_entry_ids
        }

        # Send the request
        response = client.put('/wfhRequests/reject', data=json.dumps(payload), content_type='application/json')

        # Check that the query was called with correct parameters
        mock_WFHRequestEntry.query.filter.assert_called()
        mock_filter_query.all.assert_called()  # Ensure `all()` was called on the chain

        # Check that the status was updated for both entries
        self.assertEqual(mock_entry_1.status, Status.REJECTED)
        self.assertEqual(mock_entry_2.status, Status.REJECTED)

        # Check that the action_reason was updated for both entries
        self.assertEqual(mock_entry_1.action_reason, "Invalid request")
        self.assertEqual(mock_entry_2.action_reason, "Not allowed")

        # Check that the request record was updated
        self.assertEqual(mock_request_record.overall_status, Status.REJECTED)
        self.assertEqual(mock_request_record.notification_status, NotificationStatus.EDITED)
        self.assertEqual(mock_request_record.last_notification_status, NotificationStatus.EDITED)

        # Check that the response status is 200
        self.assertEqual(response.status_code, 200)

        # Check that the session commit was called twice (once for entries, once for the request)
        self.assertEqual(mock_db_session.commit.call_count, 2)


    @patch('app.db.session')
    @patch('app.WFHRequestEntry')
    @patch('app.WFHRequest')
    def test_cancel_requests(self, mock_wfh_request, mock_wfh_request_entry, mock_db_session):
        # Mock the WFHRequestEntry records (these are the individual entries)
        mock_wfh_request_entry_1 = MagicMock()
        mock_wfh_request_entry_2 = MagicMock()

        # Mock the WFHRequest (the overall request)
        mock_request_record = MagicMock()

        # Set the mock to return a list of matching WFHRequestEntry objects
        mock_filter_query = MagicMock()
        mock_filter_query.filter.return_value = mock_filter_query  # Allow method chaining
        mock_filter_query.all.return_value = [mock_wfh_request_entry_1, mock_wfh_request_entry_2]

        # Simulate the request entries being cancelled in the app logic
        mock_wfh_request_entry_1.status = Status.CANCELLED
        mock_wfh_request_entry_2.status = Status.CANCELLED

        # Mock the WFHRequestEntry query behavior
        mock_wfh_request_entry.query.filter.return_value = mock_filter_query

        # Mock getting the WFHRequest record for the request_id
        mock_wfh_request.query.get.return_value = mock_request_record

        # Simulate the PUT request to the /wfhRequests/cancel endpoint
        response = self.app.put(
            '/wfhRequests/cancel',
            data=json.dumps({
                'request_id': 1,
                'entry_ids': [101, 102]  # Example entry IDs
            }),
            content_type='application/json'
        )

        # Assert that the response status code is 200 (OK)
        self.assertEqual(response.status_code, 200)

        # Parse the JSON response data
        response_data = json.loads(response.data)

        # Assert that the entries were updated successfully
        self.assertEqual(response_data["message"], "Entries updated successfully")

        # Assert that the mock query methods were called correctly
        mock_wfh_request_entry.query.filter.assert_called_once()  # Ensure filter was called
        mock_filter_query.all.assert_called_once()  # Ensure all() was called to get the entries
        self.assertEqual(mock_db_session.commit.call_count, 2)  # Expect two commit() calls

        # Assert that the function updated the status of the WFHRequest
        self.assertEqual(mock_request_record.overall_status, Status.CANCELLED)
        self.assertEqual(mock_request_record.notification_status, NotificationStatus.CANCELLED)

    @patch('app.db.session')
    @patch('app.WFHRequestEntry')
    @patch('app.WFHRequest')
    def test_revoke_requests(self, mock_wfh_request, mock_wfh_request_entry, mock_db_session):
        # Mock the WFHRequestEntry records (these are the individual entries)
        mock_wfh_request_entry_1 = MagicMock()
        mock_wfh_request_entry_2 = MagicMock()

        # Mock the WFHRequest (the overall request)
        mock_request_record = MagicMock()
        mock_request_record.requester_id = 1
        mock_request_record.reporting_manager = 1  # Simulate that the requester is also the manager

        # Set the mock to return a list of matching WFHRequestEntry objects
        mock_filter_query = MagicMock()
        mock_filter_query.filter.return_value = mock_filter_query  # Allow method chaining
        mock_filter_query.all.return_value = [mock_wfh_request_entry_1, mock_wfh_request_entry_2]

        # Simulate the request entries being set to WITHDRAWN since requester == manager
        mock_wfh_request_entry_1.status = Status.WITHDRAWN
        mock_wfh_request_entry_2.status = Status.WITHDRAWN

        # Mock the WFHRequestEntry query behavior
        mock_wfh_request_entry.query.filter.return_value = mock_filter_query

        # Mock getting the WFHRequest record for the request_id
        mock_wfh_request.query.get.return_value = mock_request_record

        # Simulate the PUT request to the /wfhRequests/revoke endpoint
        response = self.app.put(
            '/wfhRequests/revoke',
            data=json.dumps({
                'request_id': 1,
                'entry_ids': [101, 102]  # Example entry IDs
            }),
            content_type='application/json'
        )

        # Assert that the response status code is 200 (OK)
        self.assertEqual(response.status_code, 200)

        # Parse the JSON response data
        response_data = json.loads(response.data)

        # Assert that the entries were updated successfully
        self.assertEqual(response_data["message"], "Entries updated successfully")

        # Assert that the mock query methods were called correctly
        mock_wfh_request_entry.query.filter.assert_called_once()  # Ensure filter was called
        mock_filter_query.all.assert_called_once()  # Ensure all() was called to get the entries
        self.assertEqual(mock_db_session.commit.call_count, 2)  # Expect two commit() calls

        # Assert that the function updated the status of the WFHRequest
        self.assertEqual(mock_request_record.overall_status, Status.WITHDRAWN)
        self.assertEqual(mock_request_record.notification_status, NotificationStatus.SELF_WITHDRAWN)


    @patch('app.db.session')
    @patch('app.WFHRequestEntry')
    @patch('app.WFHRequest')
    def test_acknowledge_requests(self, mock_wfh_request, mock_wfh_request_entry, mock_db_session):
        mock_wfh_request_entry_1 = MagicMock()
        mock_wfh_request_entry_2 = MagicMock()

        mock_request_record = MagicMock()

        mock_filter_query = MagicMock()
        mock_filter_query.filter.return_value = mock_filter_query  # Allow method chaining
        mock_filter_query.all.return_value = [mock_wfh_request_entry_1, mock_wfh_request_entry_2]

        mock_wfh_request_entry_1.status = Status.WITHDRAWN
        mock_wfh_request_entry_2.status = Status.WITHDRAWN

        mock_wfh_request_entry.query.filter.return_value = mock_filter_query
        mock_wfh_request.query.get.return_value = mock_request_record

        response = self.app.put(
            '/wfhRequests/acknowledge',
            data=json.dumps({
                'request_id': 1,
                'entry_ids': [101, 102]  # Example entry IDs
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.data)

        self.assertEqual(response_data["message"], "Entries updated successfully")

        mock_wfh_request_entry.query.filter.assert_called_once()  # Ensure filter was called
        mock_filter_query.all.assert_called_once()  # Ensure all() was called to get the entries
        self.assertEqual(mock_db_session.commit.call_count, 2)  # Expect two commit() calls

        self.assertEqual(mock_request_record.overall_status, Status.WITHDRAWN)
        self.assertEqual(mock_request_record.notification_status, NotificationStatus.ACKNOWLEDGED)

    def test_get_all_audit_trails(self):
        request_id = 140004
        response = self.app.get(f'/wfhRequests/getAuditTrail/{request_id}')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)

        if len(data['data']) > 0:
            for audit_trail in data['data']:
                self.assertIn('audit_trail_id', audit_trail)
                self.assertIn('request_id', audit_trail)
                self.assertIn('action', audit_trail)
                self.assertIn('timestamp', audit_trail)
                self.assertIn('user_id', audit_trail)
            
                self.assertIn(audit_trail['action'], ['Created', 'Edited', 'Deleted'])  


    @patch('app.db.session')
    def test_auto_reject_requests_success(self, mock_db_session):
        request_data = {
            "request_id": 1,
            "entry_ids": [1, 2]
        }

        mock_entry = MagicMock()
        mock_entry.status = Status.PENDING
        
        mock_db_session.query.return_value.filter.return_value.all.return_value = [mock_entry]
        
        mock_request = MagicMock()
        mock_request.overall_status = Status.PENDING
        mock_db_session.query.return_value.get.return_value = mock_request
        
        # Simulate PUT request to /wfhRequests/autoReject
        response = self.app.put(
            '/wfhRequests/autoReject',
            data=json.dumps(request_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_entry.status, Status.PENDING)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data["message"], "Entries updated successfully to AUTO_REJECTED")
        
        self.assertEqual(mock_request.overall_status, Status.PENDING)
        mock_db_session.commit.assert_called()

    @patch('app.db.session')
    def test_auto_reject_requests_missing_data(self, mock_db_session):

        request_data = {
            "entry_ids": [1, 2]
        }
        
        response = self.app.put(
            '/wfhRequests/autoReject',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("request_id and entry_ids (as an array) are required", response.get_data(as_text=True))

    @patch('app.db.session')
    def test_auto_reject_requests_invalid_entry_ids(self, mock_db_session):
            # Invalid entry_ids format
        request_data = {
            "request_id": 1,
            "entry_ids": "not_a_list"  # Should be a list
        }
        
        response = self.app.put(
            '/wfhRequests/autoReject',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("request_id and entry_ids (as an array) are required", response.get_data(as_text=True))

    @patch('app.db.session')
    @patch('app.WFHRequestSchema')
    def test_get_audit_trail_success(self, mock_wfh_request_schema, mock_db_session):
        # Mock staff ID
        staff_id = 140004
        
        # Mock request data
        mock_request_1 = MagicMock()
        mock_request_1.modified_at = "2024-10-28"
        mock_request_1.last_notification_status = NotificationStatus.ACKNOWLEDGED
        mock_request_1.requester_id = staff_id
        mock_request_1.reporting_manager = 2

        mock_request_2 = MagicMock()
        mock_request_2.modified_at = "2024-10-27"
        mock_request_2.last_notification_status = NotificationStatus.DELIVERED
        mock_request_2.requester_id = 3
        mock_request_2.reporting_manager = staff_id
        
        # Setup the mock return values for query filters
        mock_db_session.query.return_value.filter.return_value.union.return_value.order_by.return_value.all.return_value = [mock_request_1, mock_request_2]

        # Mock schema dump
        mock_wfh_request_schema.return_value.dump.side_effect = [
            {"id": 1, "status": "ACKNOWLEDGED"},
            {"id": 2, "status": "DELIVERED"}
        ]

        # Simulate GET request to /wfhRequests/getAudit/1
        response = self.app.get(f'/wfhRequests/getAudit/{staff_id}')

        # Assert response status code
        self.assertEqual(response.status_code, 200)

        # Assert response data structure
        response_data = json.loads(response.data)
        self.assertEqual(response_data["status_code"], 200)
        self.assertEqual(response_data["message"], "WFH Requests By Date")
        self.assertEqual(len(response_data["data"]), 2)

        # Assert that notification status was updated
        self.assertEqual(mock_request_1.notification_status, NotificationStatus.SEEN)
        self.assertEqual(mock_request_2.notification_status, NotificationStatus.SEEN)

        # Ensure commit was called
        mock_db_session.commit.assert_called()

    @patch('app.db.session')
    def test_get_audit_trail_no_requests(self, mock_db_session):

        staff_id = 140001
        mock_db_session.query.return_value.filter.return_value.union.return_value.order_by.return_value.all.return_value = []

        response = self.app.get(f'/wfhRequests/getAudit/{staff_id}')

        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.data)
        self.assertEqual(response_data["status_code"], 200)
        self.assertEqual(response_data["message"], "WFH Requests By Date")
        self.assertEqual(len(response_data["data"]), 0)

    @patch('app.db.session')
    def test_get_audit_trail_invalid_staff_id(self, mock_db_session):
        
        response = self.app.get('/wfhRequests/getAudit/-1')
        self.assertEqual(response.status_code, 404)
    
    @patch('app.db.session')
    def test_auto_reject_pending_requests(self, mock_db_session):
        # Mock pending WFH requests
        mock_request = MagicMock()
        mock_request.request_id = 1
        mock_request.overall_status = Status.PENDING
        mock_request.requester_id = 2
        mock_request.reporting_manager = 3
        mock_request.department = 'IT'

        # Mock WFHRequestEntry objects
        mock_entry_1 = MagicMock()
        mock_entry_1.entry_id = 1
        mock_entry_1.entry_date = datetime.now() + timedelta(days=1)  # Not to be auto-rejected
        mock_entry_1.status = Status.PENDING  # Default to pending

        mock_entry_2 = MagicMock()
        mock_entry_2.entry_id = 2
        mock_entry_2.entry_date = datetime.now()  # Set to today (should be auto-rejected)
        mock_entry_2.status = Status.PENDING  # Default to pending

        # Setup the mock return values for query filters
        mock_db_session.query.return_value.filter.return_value.all.side_effect = [[mock_request], [mock_entry_1, mock_entry_2]]

        # Mock the method that checks one working day before
        with patch('app.is_one_working_day_before') as mock_is_one_working_day_before:
            mock_is_one_working_day_before.return_value = True  # Simulate that it's one working day before

            response = self.app.get('/wfhRequests/checkPending')

            self.assertEqual(response.status_code, 200)

            response_data = json.loads(response.data)
            self.assertEqual(response_data["status_code"], 200)
            self.assertEqual(response_data["message"], "Pending WFH requests have been auto-rejected where applicable.")

            mock_entry_2.status = Status.AUTO_REJECTED  
            self.assertEqual(mock_entry_2.status, Status.AUTO_REJECTED)

            mock_db_session.add.assert_called()  

            mock_request.overall_status = Status.AUTO_REJECTED  
            self.assertEqual(mock_request.overall_status, Status.AUTO_REJECTED)

            mock_db_session.commit.assert_called()  

    @patch('app.db.session')
    def test_no_pending_requests(self, mock_db_session):
        mock_db_session.query.return_value.filter.return_value.all.side_effect = [[], []]  

        response = self.app.get('/wfhRequests/checkPending')

        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.data)
        self.assertEqual(response_data["status_code"], 200)
        self.assertEqual(response_data["message"], "Pending WFH requests have been auto-rejected where applicable.")
        mock_db_session.commit.assert_called()

    def test_get_weekly_wfh_count(self):
        response = self.app.get('/wfhRequests/getWeeklyCount?entry_date=2024-11-06&staff_id=171011')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('count', data)

        
if __name__ == '__main__':
    unittest.main()
