import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { eventsApi } from '../../api/events.api';
import { attendeeApi } from '../../api/attendee.api';
import { useAuth } from '../../contexts/AuthContext';
import type { EventType, TicketType } from '../../types';
import { UserRole } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import { formatPrice } from '../../utils/priceFormat';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';

const EventDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [event, setEvent] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState('');

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Loading event:', id);
            const response = await eventsApi.getEventById(id!);
            console.log('Event loaded:', response.data.event);
            setEvent(response.data.event);
        } catch (err: any) {
            console.error('Error loading event:', err);
            console.error('Error response:', err.response);
            setError('Failed to load event details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookTicket = (ticket: TicketType) => {
        if (!user) {
            alert('Please login to book tickets');
            return;
        }
        setSelectedTicket(ticket);
        setQuantity(1);
        setShowBookingModal(true);
    };

    const confirmBooking = async () => {
        if (!selectedTicket || !event) return;

        setBookingLoading(true);
        setError('');
        try {
            await attendeeApi.bookTicket({
                eventId: event.id,
                ticketTypeId: selectedTicket.id,
                quantity,
            });
            setBookingSuccess('Booking successful! Check your bookings page.');
            setShowBookingModal(false);
            loadEvent(); // Reload to update availability
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to book ticket. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!event) return <Container className="py-5"><Alert variant="danger">Event not found</Alert></Container>;

    return (
        <Container className="py-4">
            {error && <ErrorAlert message={error} onClose={() => setError('')} />}
            {bookingSuccess && (
                <Alert variant="success" dismissible onClose={() => setBookingSuccess('')}>
                    {bookingSuccess}
                </Alert>
            )}

            {/* Event Banner */}
            {event.bannerImage && (
                <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-100 rounded mb-4"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
            )}

            <Row>
                <Col lg={8}>
                    {/* Event Details */}
                    <h1>{event.title}</h1>

                    <div className="mb-3">
                        <Badge bg="secondary" className="me-2">{event.category?.name}</Badge>
                        {event.isReported && <Badge bg="danger">Reported</Badge>}
                    </div>

                    <div className="mb-4">
                        <p className="mb-2">
                            <strong><i className="bi bi-calendar me-2"></i>Date:</strong>{' '}
                            {formatEventDateTime(event.startDateTime)} - {formatEventDateTime(event.endDateTime)}
                        </p>
                        <p className="mb-2">
                            <strong><i className="bi bi-geo-alt me-2"></i>Location:</strong> {event.location}
                        </p>
                        {event.organizer && (
                            <p className="mb-2">
                                <strong><i className="bi bi-person me-2"></i>Organizer:</strong>{' '}
                                {event.organizer.firstName} {event.organizer.lastName}
                            </p>
                        )}
                        <p className="mb-2">
                            <strong><i className="bi bi-people me-2"></i>Capacity:</strong> {event.capacity}
                        </p>
                    </div>

                    <Card className="mb-4">
                        <Card.Header><strong>About This Event</strong></Card.Header>
                        <Card.Body>
                            <p>{event.description}</p>
                        </Card.Body>
                    </Card>

                    {/* Reviews Section */}
                    {event.reviews && event.reviews.length > 0 && (
                        <Card>
                            <Card.Header>
                                <strong>Reviews</strong>
                                {event.averageRating && (
                                    <span className="ms-2">
                                        ({event.averageRating.toFixed(1)} <i className="bi bi-star-fill text-warning"></i>)
                                    </span>
                                )}
                            </Card.Header>
                            <Card.Body>
                                {event.reviews.slice(0, 5).map((review) => (
                                    <div key={review.id} className="mb-3 pb-3 border-bottom">
                                        <div className="d-flex justify-content-between">
                                            <strong>{review.user?.firstName} {review.user?.lastName}</strong>
                                            <div>
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <i key={i} className="bi bi-star-fill text-warning me-1"></i>
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <p className="mt-2 mb-0">{review.comment}</p>}
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col lg={4}>
                    {/* Ticket Types */}
                    <Card>
                        <Card.Header><strong>Tickets</strong></Card.Header>
                        <Card.Body>
                            {event.ticketTypes && event.ticketTypes.length > 0 ? (
                                event.ticketTypes.map((ticket) => (
                                    <Card key={ticket.id} className="mb-3">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6>{ticket.name}</h6>
                                                    {ticket.description && (
                                                        <small className="text-muted">{ticket.description}</small>
                                                    )}
                                                </div>
                                                <Badge bg={ticket.price === 0 ? 'success' : 'primary'}>
                                                    {formatPrice(ticket.price)}
                                                </Badge>
                                            </div>

                                            <div className="mb-2">
                                                <small>
                                                    Available: {ticket.capacity - ticket.sold} / {ticket.capacity}
                                                </small>
                                            </div>

                                            {user?.role === UserRole.ATTENDEE ? (
                                                ticket.capacity - ticket.sold > 0 ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="w-100"
                                                        onClick={() => handleBookTicket(ticket)}
                                                    >
                                                        Book Now
                                                    </Button>
                                                ) : (
                                                    <Button variant="secondary" size="sm" className="w-100" disabled>
                                                        Sold Out
                                                    </Button>
                                                )
                                            ) : !user ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-100"
                                                    as={Link}
                                                    to="/login"
                                                >
                                                    Login to Book
                                                </Button>
                                            ) : (
                                                <small className="text-muted">Attendees only</small>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-muted">No tickets available yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Booking Modal */}
            <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Book Ticket</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTicket && (
                        <>
                            <p><strong>Ticket Type:</strong> {selectedTicket.name}</p>
                            <p><strong>Price:</strong> {formatPrice(selectedTicket.price)}</p>

                            <Form.Group>
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={selectedTicket.capacity - selectedTicket.sold}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                            </Form.Group>

                            <div className="mt-3">
                                <strong>Total: {formatPrice(selectedTicket.price * quantity)}</strong>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={confirmBooking} disabled={bookingLoading}>
                        {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default EventDetailsPage;
