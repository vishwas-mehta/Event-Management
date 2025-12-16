import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { attendeeApi } from '../../api/attendee.api';
import { BookingStatus } from '../../types';
import type { BookingType } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import { formatPrice } from '../../utils/priceFormat';
import { extractErrorMessage } from '../../utils/errorHelper';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';

interface ReviewFormData {
    rating: number;
    comment: string;
    imageUrl: string;
}

const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState('');

    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewBooking, setReviewBooking] = useState<BookingType | null>(null);
    const [reviewForm, setReviewForm] = useState<ReviewFormData>({ rating: 5, comment: '', imageUrl: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await attendeeApi.getMyBookings();
            setBookings(response.data.bookings);
        } catch (err: any) {
            setError('Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        setActionLoading(bookingId);
        setError('');
        try {
            await attendeeApi.cancelBooking(bookingId);
            setSuccess('Booking cancelled successfully.');
            loadBookings();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to cancel booking.'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAttendance = async (bookingId: string) => {
        setActionLoading(bookingId);
        setError('');
        try {
            await attendeeApi.markAttendance(bookingId);
            setSuccess('Attendance marked successfully. You can now leave a review!');
            loadBookings();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to mark attendance.'));
        } finally {
            setActionLoading(null);
        }
    };

    const openReviewModal = (booking: BookingType) => {
        setReviewBooking(booking);
        setReviewForm({ rating: 5, comment: '', imageUrl: '' });
        setReviewError('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewBooking) return;

        if (reviewForm.rating < 1 || reviewForm.rating > 5) {
            setReviewError('Please select a rating between 1 and 5');
            return;
        }

        setReviewLoading(true);
        setReviewError('');

        try {
            // Build review data with optional mediaFiles
            const reviewData: { rating: number; comment?: string; mediaFiles?: string[] } = {
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            };

            // Add image URL to mediaFiles if provided
            if (reviewForm.imageUrl.trim()) {
                reviewData.mediaFiles = [reviewForm.imageUrl.trim()];
            }

            await attendeeApi.createReview(reviewBooking.eventId, reviewData);
            setShowReviewModal(false);
            setSuccess('Thank you for your review!');
            loadBookings();
        } catch (err: any) {
            setReviewError(extractErrorMessage(err, 'Failed to submit review. You may have already reviewed this event.'));
        } finally {
            setReviewLoading(false);
        }
    };

    const StarRating: React.FC<{ rating: number; onChange: (r: number) => void }> = ({ rating, onChange }) => {
        return (
            <div className="d-flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => onChange(star)}
                        style={{ fontSize: '2rem', textDecoration: 'none' }}
                    >
                        <span style={{ color: star <= rating ? '#ffc107' : '#e0e0e0' }}>
                            ★
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    // Separate bookings by status
    const upcomingBookings = bookings.filter(b =>
        b.status === BookingStatus.CONFIRMED && new Date(b.event?.startDateTime || '') > new Date()
    );
    const pastBookings = bookings.filter(b =>
        b.status === BookingStatus.ATTENDED ||
        (b.status === BookingStatus.CONFIRMED && new Date(b.event?.startDateTime || '') <= new Date())
    );
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED);

    const renderBookingCard = (booking: BookingType) => {
        const isPast = new Date(booking.event?.startDateTime || '') <= new Date();
        const canMarkAttendance = booking.status === BookingStatus.CONFIRMED && isPast;
        const canReview = booking.status === BookingStatus.ATTENDED;

        return (
            <Col key={booking.id} md={6} lg={4} className="mb-4">
                <Card className={`h-100 ${canReview ? 'border-success' : ''}`}>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="mb-0">{booking.event?.title}</h5>
                            {booking.status === BookingStatus.CONFIRMED && (
                                <Badge bg="success">Confirmed</Badge>
                            )}
                            {booking.status === BookingStatus.CANCELLED && (
                                <Badge bg="danger">Cancelled</Badge>
                            )}
                            {booking.status === BookingStatus.ATTENDED && (
                                <Badge bg="primary">Attended</Badge>
                            )}
                        </div>

                        <p className="text-muted small mb-2">
                            📅 {formatEventDateTime(booking.event?.startDateTime || '')}
                        </p>
                        <p className="text-muted small mb-2">
                            📍 {booking.event?.location}
                        </p>

                        <div className="mb-2">
                            <small><strong>Reference:</strong> <code>{booking.bookingReference}</code></small>
                        </div>
                        <div className="mb-2">
                            <small><strong>Ticket:</strong> {booking.ticketType?.name} × {booking.quantity}</small>
                        </div>
                        <div className="mb-3">
                            <small><strong>Total:</strong> {formatPrice(booking.totalPrice)}</small>
                        </div>

                        <div className="d-grid gap-2">
                            {/* Upcoming: Mark Attendance & Cancel */}
                            {canMarkAttendance && (
                                <>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleMarkAttendance(booking.id)}
                                        disabled={actionLoading === booking.id}
                                    >
                                        {actionLoading === booking.id ? 'Marking...' : '✓ Mark Attendance'}
                                    </Button>
                                </>
                            )}

                            {/* Can cancel if confirmed and not yet attended */}
                            {booking.status === BookingStatus.CONFIRMED && !isPast && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={actionLoading === booking.id}
                                >
                                    Cancel Booking
                                </Button>
                            )}

                            {/* Attended: Leave Review */}
                            {canReview && (
                                <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => openReviewModal(booking)}
                                >
                                    ⭐ Leave a Review
                                </Button>
                            )}

                            <Button
                                variant="outline-primary"
                                size="sm"
                                as={Link}
                                to={`/events/${booking.eventId}`}
                            >
                                View Event
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">My Bookings</h2>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {bookings.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-5">
                        <p className="text-muted">You haven't booked any events yet.</p>
                        <Button as={Link} to="/events" variant="primary">
                            Browse Events
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {/* Upcoming Bookings */}
                    {upcomingBookings.length > 0 && (
                        <>
                            <h4 className="mb-3">📅 Upcoming Events</h4>
                            <Row>{upcomingBookings.map(renderBookingCard)}</Row>
                        </>
                    )}

                    {/* Past/Attended Bookings */}
                    {pastBookings.length > 0 && (
                        <>
                            <h4 className="mb-3 mt-4">✓ Past Events</h4>
                            <Row>{pastBookings.map(renderBookingCard)}</Row>
                        </>
                    )}

                    {/* Cancelled Bookings */}
                    {cancelledBookings.length > 0 && (
                        <>
                            <h4 className="mb-3 mt-4 text-muted">Cancelled</h4>
                            <Row>{cancelledBookings.map(renderBookingCard)}</Row>
                        </>
                    )}
                </>
            )}

            {/* Review Modal */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Leave a Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {reviewBooking && (
                        <>
                            <p className="mb-3">
                                <strong>{reviewBooking.event?.title}</strong>
                            </p>

                            {reviewError && (
                                <Alert variant="danger" className="py-2">
                                    {reviewError}
                                </Alert>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Your Rating</Form.Label>
                                <StarRating
                                    rating={reviewForm.rating}
                                    onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
                                />
                                <small className="text-muted">
                                    {reviewForm.rating === 1 && 'Poor'}
                                    {reviewForm.rating === 2 && 'Fair'}
                                    {reviewForm.rating === 3 && 'Good'}
                                    {reviewForm.rating === 4 && 'Very Good'}
                                    {reviewForm.rating === 5 && 'Excellent'}
                                </small>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Your Review (Optional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Share your experience at this event..."
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                    >
                        {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MyBookingsPage;
