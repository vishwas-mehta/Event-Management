import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { organizerApi } from '../../api/organizer.api';
import type { OrganizerDashboardStats, EventType, ReviewType } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const OrganizerDashboard: React.FC = () => {
    const [stats, setStats] = useState<OrganizerDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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

    // Collect all reviews from all events
    const getAllReviews = (): Array<ReviewType & { eventTitle: string; eventId: string }> => {
        if (!stats?.events) return [];

        const reviews: Array<ReviewType & { eventTitle: string; eventId: string }> = [];
        stats.events.forEach((event: EventType) => {
            if (event.reviews && event.reviews.length > 0) {
                event.reviews.forEach((review: ReviewType) => {
                    reviews.push({
                        ...review,
                        eventTitle: event.title,
                        eventId: event.id,
                    });
                });
            }
        });

        // Sort by most recent first
        return reviews.sort((a, b) =>
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
    };

    // Calculate average rating
    const getAverageRating = (): string => {
        const reviews = getAllReviews();
        if (reviews.length === 0) return 'N/A';
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        return avg.toFixed(1);
    };

    const renderStars = (rating: number) => {
        return (
            <span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ color: star <= rating ? '#ffc107' : '#e0e0e0' }}>
                        ★
                    </span>
                ))}
            </span>
        );
    };

    if (loading) return <LoadingSpinner />;

    const allReviews = getAllReviews();
    const totalReviews = allReviews.length;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Organizer Dashboard</h2>
                <Button as={Link} to="/organizer/events/create" variant="primary">
                    Create New Event
                </Button>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
                {/* Overview Tab */}
                <Tab eventKey="overview" title="Overview">
                    {/* Stats */}
                    <Row className="mb-4">
                        <Col md={3}>
                            <Card className="stat-card">
                                <Card.Body>
                                    <h3>{stats?.stats?.totalEvents || 0}</h3>
                                    <p className="text-muted mb-0">Total Events</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="stat-card">
                                <Card.Body>
                                    <h3>{stats?.stats?.totalBookings || 0}</h3>
                                    <p className="text-muted mb-0">Total Bookings</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="stat-card">
                                <Card.Body>
                                    <h3>{stats?.stats?.upcomingEvents || 0}</h3>
                                    <p className="text-muted mb-0">Upcoming Events</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="stat-card">
                                <Card.Body>
                                    <h3>
                                        {getAverageRating()} <small className="text-warning">★</small>
                                    </h3>
                                    <p className="text-muted mb-0">{totalReviews} Reviews</p>
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
                                    {stats.events.map((event: EventType) => (
                                        <div key={event.id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">
                                                        {event.title}
                                                        {event.reviews && event.reviews.length > 0 && (
                                                            <Badge bg="warning" className="ms-2 text-dark">
                                                                {event.reviews.length} reviews
                                                            </Badge>
                                                        )}
                                                    </h6>
                                                    <small className="text-muted">
                                                        {formatEventDateTime(event.startDateTime)} • {event.location}
                                                    </small>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        as={Link}
                                                        to={`/organizer/events/${event.id}/edit`}
                                                        variant="primary"
                                                        size="sm"
                                                    >
                                                        Manage
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
                </Tab>

                {/* Reviews Tab */}
                <Tab eventKey="reviews" title={<>⭐ Reviews <Badge bg="secondary">{totalReviews}</Badge></>}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <strong>Customer Feedback</strong>
                            <span className="text-muted">
                                Average: <strong>{getAverageRating()} ★</strong> from {totalReviews} reviews
                            </span>
                        </Card.Header>
                        <Card.Body>
                            {allReviews.length > 0 ? (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Event</th>
                                            <th>Rating</th>
                                            <th>Review</th>
                                            <th>Reviewer</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allReviews.map((review) => (
                                            <tr key={review.id}>
                                                <td>
                                                    <Link to={`/events/${review.eventId}`}>
                                                        {review.eventTitle}
                                                    </Link>
                                                </td>
                                                <td>{renderStars(review.rating)}</td>
                                                <td>
                                                    {review.comment ? (
                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                                                            {review.comment}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">No comment</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {review.user ? (
                                                        `${review.user.firstName} ${review.user.lastName}`
                                                    ) : (
                                                        'Anonymous'
                                                    )}
                                                </td>
                                                <td>
                                                    {review.createdAt ?
                                                        new Date(review.createdAt).toLocaleDateString() :
                                                        'N/A'
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <span style={{ fontSize: '3rem' }}>⭐</span>
                                    <p className="text-muted mt-3">
                                        No reviews yet. Reviews will appear here once attendees leave feedback for your events.
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Per-Event Review Summary */}
                    {stats?.events && stats.events.some((e: EventType) => e.reviews && e.reviews.length > 0) && (
                        <Card className="mt-4">
                            <Card.Header><strong>Reviews by Event</strong></Card.Header>
                            <Card.Body>
                                <Row>
                                    {stats.events
                                        .filter((e: EventType) => e.reviews && e.reviews.length > 0)
                                        .map((event: EventType) => {
                                            const avgRating = event.reviews!.reduce((s, r) => s + r.rating, 0) / event.reviews!.length;
                                            return (
                                                <Col md={4} key={event.id} className="mb-3">
                                                    <Card>
                                                        <Card.Body className="text-center">
                                                            <h6>{event.title}</h6>
                                                            <div className="my-2">
                                                                {renderStars(Math.round(avgRating))}
                                                            </div>
                                                            <p className="mb-0">
                                                                <strong>{avgRating.toFixed(1)}</strong>
                                                                <span className="text-muted"> ({event.reviews!.length} reviews)</span>
                                                            </p>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default OrganizerDashboard;
