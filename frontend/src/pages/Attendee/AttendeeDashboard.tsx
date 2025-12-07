import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { attendeeApi } from '../../api/attendee.api';
import type { BookingType } from '../../types';
import { BookingStatus } from '../../types';
import { formatEventDateTime, isEventPast, isEventUpcoming } from '../../utils/dateFormat';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AttendeeDashboard: React.FC = () => {
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const response = await attendeeApi.getMyBookings();
            setBookings(response.data.bookings);
        } catch (err) {
            console.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const upcomingEvents = bookings.filter(
        (b) => b.status === BookingStatus.CONFIRMED && b.event && isEventUpcoming(b.event.startDateTime)
    );

    const pastEvents = bookings.filter(
        (b) => b.event && isEventPast(b.event.endDateTime)
    );

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-5">
            <div className="mb-5">
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Welcome back!</h2>
                <p className="text-muted lead" style={{ fontSize: '1.125rem' }}>Here's an overview of your events</p>
            </div>

            {/* Stats */}
            <Row className="g-4 mb-5">
                <Col md={4}>
                    <Card className="stat-card h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h3>{bookings.length}</h3>
                                    <p>Total Bookings</p>
                                </div>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-ticket-perforated" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stat-card h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h3>{upcomingEvents.length}</h3>
                                    <p>Upcoming Events</p>
                                </div>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-calendar-event" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stat-card h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h3>{pastEvents.length}</h3>
                                    <p>Events Attended</p>
                                </div>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-check-circle" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Upcoming Events */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0" style={{ fontSize: '1.125rem', fontWeight: '700' }}>Upcoming Events</h5>
                    <Button as={Link} to="/attendee/bookings" variant="outline-primary" size="sm">
                        View All Bookings
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: 'var(--gray-300)' }}></i>
                            <p className="text-muted mt-3 mb-4">No upcoming events</p>
                            <Button as={Link} to="/events" variant="primary">
                                Browse Events
                            </Button>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {upcomingEvents.slice(0, 5).map((booking) => (
                                <Link
                                    key={booking.id}
                                    to={`/events/${booking.eventId}`}
                                    className="list-group-item list-group-item-action"
                                    style={{ padding: '1.25rem 1.5rem' }}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1" style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                                                {booking.event?.title}
                                            </h6>
                                            <small className="text-muted">
                                                <i className="bi bi-calendar3 me-2"></i>
                                                {formatEventDateTime(booking.event?.startDateTime || '')}
                                            </small>
                                        </div>
                                        <span className="badge bg-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                            {booking.quantity} Ticket{booking.quantity > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AttendeeDashboard;
