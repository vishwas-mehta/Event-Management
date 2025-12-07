import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const ManageEventPage: React.FC = () => {
    return (
        <Container className="py-4">
            <Alert variant="info">
                Manage Event page - View attendees, add ticket types, view statistics.
                Coming soon!
            </Alert>
        </Container>
    );
};

export default ManageEventPage;
