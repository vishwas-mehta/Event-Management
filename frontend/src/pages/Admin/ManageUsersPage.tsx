import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const ManageUsersPage: React.FC = () => {
    return (
        <Container className="py-4">
            <h2 className="mb-4">Manage Users</h2>
            <Alert variant="info">
                User management page with pagination, search, and status update functionality.
                Coming soon!
            </Alert>
        </Container>
    );
};

export default ManageUsersPage;
