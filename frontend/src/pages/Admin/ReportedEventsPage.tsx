import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const ReportedEventsPage: React.FC = () => {
    return (
        <Container className="py-4">
            <h2 className="mb-4">Reported Events</h2>
            <Alert variant="info">
                Reported events management page with action capabilities.
                Coming soon!
            </Alert>
        </Container>
    );
};

export default ReportedEventsPage;
