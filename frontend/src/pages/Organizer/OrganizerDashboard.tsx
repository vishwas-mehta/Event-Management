import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { organizerApi } from '../../api/organizer.api';
import type { OrganizerDashboardStats } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const OrganizerDashboard: React.FC = () => {
    const [stats, setStats] = useState<OrganizerDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await organizerApi.getDashboard();
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Organizer Dashboard</h2>
                <Button as={Link} to="/organizer/events/create" variant="primary">
                    Create New Event
                </Button>
            </div>

            {/* Stats */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.stats?.totalEvents || 0}</h3>
                            <p className="text-muted mb-0">Total Events</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.stats?.totalBookings || 0}</h3>
                            <p className="text-muted mb-0">Total Bookings</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.stats?.upcomingEvents || 0}</h3>
                            <p className="text-muted mb-0">Upcoming Events</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Events List */}
            <Card>
                <Card.Header><strong>Your Events</strong></Card.Header>
                <Card.Body>
                    {stats?.events && stats.events.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {stats.events.map((event) => (
                                <div key={event.id} className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{event.title}</h6>
                                            <small className="text-muted">
                                                {formatEventDateTime(event.startDateTime)} • {event.location}
                                            </small>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Button
                                                as={Link}
                                                to={`/organizer/events/${event.id}/manage`}
                                                variant="primary"
                                                size="sm"
                                            >
                                                Manage
                                            </Button>
                                            <Button
                                                as={Link}
                                                to={`/organizer/events/${event.id}/edit`}
                                                variant="outline-secondary"
                                                size="sm"
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center mb-0">No events yet. Create your first event!</p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default OrganizerDashboard;
