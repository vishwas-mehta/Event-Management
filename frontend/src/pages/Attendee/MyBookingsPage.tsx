import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { attendeeApi } from '../../api/attendee.api';
import { BookingStatus } from '../../types';
import type { BookingType } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import { formatPrice } from '../../utils/priceFormat';
import { extractErrorMessage } from '../../utils/errorHelper';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';

const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState('');

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
            setSuccess('Attendance marked successfully.');
            loadBookings();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to mark attendance.'));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

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
                <Row>
                    {bookings.map((booking) => (
                        <Col key={booking.id} md={6} lg={4} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <h5>{booking.event?.title}</h5>
                                    <p className="text-muted small mb-2">
                                        {formatEventDateTime(booking.event?.startDateTime || '')}
                                    </p>

                                    <div className="mb-2">
                                        <strong>Reference:</strong> {booking.bookingReference}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Ticket Type:</strong> {booking.ticketType?.name}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Quantity:</strong> {booking.quantity}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Total:</strong> {formatPrice(booking.totalPrice)}
                                    </div>

                                    <div className="mb-3">
                                        {booking.status === BookingStatus.CONFIRMED && (
                                            <span className="badge bg-success">Confirmed</span>
                                        )}
                                        {booking.status === BookingStatus.CANCELLED && (
                                            <span className="badge bg-danger">Cancelled</span>
                                        )}
                                        {booking.status === BookingStatus.ATTENDED && (
                                            <span className="badge bg-primary">Attended</span>
                                        )}
                                    </div>

                                    <div className="d-grid gap-2">
                                        {booking.status === BookingStatus.CONFIRMED && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleMarkAttendance(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                >
                                                    Mark Attendance
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            </>
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
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MyBookingsPage;
