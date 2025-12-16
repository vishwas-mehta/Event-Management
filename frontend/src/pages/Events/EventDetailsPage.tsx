import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { eventsApi } from '../../api/events.api';
import { attendeeApi } from '../../api/attendee.api';
import { useAuth } from '../../contexts/AuthContext';
import type { EventType, TicketType } from '../../types';
import { UserRole } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import { extractErrorMessage } from '../../utils/errorHelper';
import { isYouTubeUrl, getYouTubeVideoId, getYouTubeEmbedUrl } from '../../utils/mediaHelper';
import { formatPrice } from '../../utils/priceFormat';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import PaymentModal from '../../components/Payment/PaymentModal';

const EventDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [event, setEvent] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState('');

    // Report event state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');

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
            setError(extractErrorMessage(err, 'Failed to load event details. Please try again.'));
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

        // Pre-booking validation
        const available = selectedTicket.capacity - selectedTicket.sold;
        if (quantity > available) {
            setError(`Only ${available} ticket${available !== 1 ? 's' : ''} available. Please reduce your quantity.`);
            return;
        }

        if (quantity < 1) {
            setError('Quantity must be at least 1.');
            return;
        }

        // Check if ticket is paid
        const ticketPrice = Number(selectedTicket.price);
        if (ticketPrice > 0) {
            // Show payment modal for paid tickets
            setShowBookingModal(false);
            setShowPaymentModal(true);
        } else {
            // Book directly for free tickets
            await doBooking();
        }
    };

    const doBooking = async () => {
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
            setShowPaymentModal(false);
            loadEvent(); // Reload to update availability
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to book ticket. Please try again.'));
        } finally {
            setBookingLoading(false);
        }
    };

    const handleReportEvent = async () => {
        if (!event || !reportReason.trim()) {
            setError('Please provide a reason for reporting this event.');
            return;
        }

        setReportLoading(true);
        setError('');
        try {
            await eventsApi.reportEvent(event.id, reportReason.trim());
            setReportSuccess('Event reported successfully. Our team will review it.');
            setShowReportModal(false);
            setReportReason('');
            loadEvent(); // Reload to update isReported status
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to report event. Please try again.'));
        } finally {
            setReportLoading(false);
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

            {/* Event Media - Banner Image and/or Video */}
            {(event.bannerImage || event.teaserVideo) && (
                <div className="mb-4">
                    {/* Check teaserVideo first for YouTube, then bannerImage */}
                    {event.teaserVideo && isYouTubeUrl(event.teaserVideo) ? (
                        /* YouTube Video from teaserVideo field */
                        <div style={{
                            position: 'relative',
                            paddingTop: '56.25%',
                            borderRadius: '0.375rem',
                            overflow: 'hidden',
                            background: '#000'
                        }}>
                            <iframe
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                src={getYouTubeEmbedUrl(getYouTubeVideoId(event.teaserVideo)!)}
                                title={event.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : event.bannerImage && isYouTubeUrl(event.bannerImage) ? (
                        /* YouTube Video from bannerImage field (fallback) */
                        <div style={{
                            position: 'relative',
                            paddingTop: '56.25%',
                            borderRadius: '0.375rem',
                            overflow: 'hidden',
                            background: '#000'
                        }}>
                            <iframe
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                src={getYouTubeEmbedUrl(getYouTubeVideoId(event.bannerImage)!)}
                                title={event.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : event.bannerImage ? (
                        /* Regular Image */
                        <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="w-100 rounded"
                            style={{
                                maxHeight: '500px',
                                objectFit: 'cover',
                                objectPosition: 'center'
                            }}
                        />
                    ) : null}
                </div>
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
                                event.ticketTypes.map((ticket) => {
                                    // Check for early bird pricing
                                    const dp = ticket.dynamicPricing as any;
                                    const hasEarlyBird = dp?.type === 'early_bird' && dp?.earlyBirdQuantity !== undefined;
                                    const earlyBirdRemaining = hasEarlyBird ? Math.max(0, dp.earlyBirdQuantity - ticket.sold) : 0;
                                    const isEarlyBirdActive = hasEarlyBird && earlyBirdRemaining > 0;
                                    const currentPrice = isEarlyBirdActive ? (dp.earlyBirdPrice || ticket.price) : (dp?.originalPrice || ticket.price);
                                    const regularPrice = dp?.originalPrice || ticket.price;

                                    return (
                                        <Card key={ticket.id} className={`mb-3 ${isEarlyBirdActive ? 'border-warning' : ''}`}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6>{ticket.name}</h6>
                                                        {ticket.description && (
                                                            <small className="text-muted">{ticket.description}</small>
                                                        )}
                                                    </div>
                                                    <div className="text-end">
                                                        {isEarlyBirdActive ? (
                                                            <>
                                                                <Badge bg="warning" className="mb-1">🐦 EARLY BIRD</Badge>
                                                                <div>
                                                                    <strong className="text-success">{formatPrice(currentPrice)}</strong>
                                                                    <small className="text-muted text-decoration-line-through ms-2">
                                                                        {formatPrice(regularPrice)}
                                                                    </small>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <Badge bg={Number(currentPrice) === 0 ? 'success' : 'primary'}>
                                                                {formatPrice(currentPrice)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <small>
                                                        Available: {ticket.capacity - ticket.sold} / {ticket.capacity}
                                                    </small>
                                                    {isEarlyBirdActive && (
                                                        <small className="d-block text-warning">
                                                            ⚡ {earlyBirdRemaining} early bird ticket{earlyBirdRemaining !== 1 ? 's' : ''} left!
                                                        </small>
                                                    )}
                                                    {hasEarlyBird && !isEarlyBirdActive && (
                                                        <small className="d-block text-muted">
                                                            Early bird sold out
                                                        </small>
                                                    )}
                                                </div>

                                                {user?.role === UserRole.ATTENDEE ? (
                                                    ticket.capacity - ticket.sold > 0 ? (
                                                        <Button
                                                            variant={isEarlyBirdActive ? "warning" : "primary"}
                                                            size="sm"
                                                            className="w-100"
                                                            onClick={() => handleBookTicket(ticket)}
                                                        >
                                                            {isEarlyBirdActive ? `Book Now at ${formatPrice(currentPrice)}` : 'Book Now'}
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
                                    )
                                })
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

            {/* Payment Modal for Paid Tickets */}
            {selectedTicket && event && (
                <PaymentModal
                    show={showPaymentModal}
                    onHide={() => setShowPaymentModal(false)}
                    ticketName={selectedTicket.name}
                    ticketPrice={Number(selectedTicket.price)}
                    quantity={quantity}
                    eventName={event.title}
                    onPaymentComplete={doBooking}
                    loading={bookingLoading}
                />
            )}
        </Container>
    );
};

export default EventDetailsPage;
