import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Table } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { organizerApi } from '../../api/organizer.api';
import { eventsApi } from '../../api/events.api';
import type { CategoryType, EventType } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import { extractErrorMessage } from '../../utils/errorHelper';

const EditEventPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [event, setEvent] = useState<EventType | null>(null);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        address: '',
        categoryId: '',
        capacity: 100,
        bannerImage: '',
        teaserVideo: '',
        isPublished: true,
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [categoriesRes, eventRes] = await Promise.all([
                eventsApi.getCategories(),
                organizerApi.getEventById(id!)
            ]);

            setCategories(categoriesRes.data.categories);
            const eventData = eventRes.data.event;
            setEvent(eventData);

            // Load attendees separately
            try {
                const attendeesRes = await organizerApi.getEventAttendees(id!);
                setAttendees(attendeesRes.data.bookings || []);
            } catch {
                setAttendees([]);
            }

            // Format dates for datetime-local input
            const formatDateForInput = (dateStr: string) => {
                const date = new Date(dateStr);
                return date.toISOString().slice(0, 16);
            };

            setFormData({
                title: eventData.title,
                description: eventData.description,
                startDateTime: formatDateForInput(eventData.startDateTime),
                endDateTime: formatDateForInput(eventData.endDateTime),
                location: eventData.location,
                address: eventData.address || '',
                categoryId: eventData.categoryId,
                capacity: eventData.capacity,
                bannerImage: eventData.bannerImage || '',
                teaserVideo: eventData.teaserVideo || '',
                isPublished: eventData.isPublished,
            });
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to load event'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await organizerApi.updateEvent(id!, {
                ...formData,
                capacity: Number(formData.capacity),
            });
            setSuccess('Event updated successfully!');
            loadData();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to update event.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        setError('');

        try {
            await organizerApi.deleteEvent(id!);
            navigate('/organizer/dashboard');
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to delete event. It may have existing bookings.'));
            setDeleting(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!event) return <Container className="py-4"><Alert variant="danger">Event not found</Alert></Container>;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Edit Event</h2>
                <div>
                    <Button
                        variant="danger"
                        className="me-2"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete Event'}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/organizer/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Tabs defaultActiveKey="details" className="mb-4">
                {/* Event Details Tab */}
                <Tab eventKey="details" title="Event Details">
                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Event Title *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Description *</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Start Date & Time *</Form.Label>
                                                    <Form.Control
                                                        type="datetime-local"
                                                        name="startDateTime"
                                                        value={formData.startDateTime}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>End Date & Time *</Form.Label>
                                                    <Form.Control
                                                        type="datetime-local"
                                                        name="endDateTime"
                                                        value={formData.endDateTime}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Location *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Address</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Category *</Form.Label>
                                            <Form.Select
                                                name="categoryId"
                                                value={formData.categoryId}
                                                onChange={handleChange}
                                                required
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Capacity *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="capacity"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Banner Image URL</Form.Label>
                                            <Form.Control
                                                type="url"
                                                name="bannerImage"
                                                value={formData.bannerImage}
                                                onChange={handleChange}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Video URL (YouTube)</Form.Label>
                                            <Form.Control
                                                type="url"
                                                name="teaserVideo"
                                                value={formData.teaserVideo}
                                                onChange={handleChange}
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="checkbox"
                                                name="isPublished"
                                                label="Published"
                                                checked={formData.isPublished}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Button type="submit" variant="primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Attendees Tab */}
                <Tab eventKey="attendees" title="Attendees">
                    <Card>
                        <Card.Header><strong>Registered Attendees</strong></Card.Header>
                        <Card.Body>
                            {attendees && attendees.length > 0 ? (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Ticket</th>
                                            <th>Qty</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendees.map((attendee: any) => (
                                            <tr key={attendee.id}>
                                                <td><code>{attendee.bookingReference}</code></td>
                                                <td>{attendee.user?.firstName} {attendee.user?.lastName}</td>
                                                <td>{attendee.user?.email}</td>
                                                <td>{attendee.ticketType}</td>
                                                <td>{attendee.quantity}</td>
                                                <td>{attendee.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-muted">No attendees yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container >
    );
};

export default EditEventPage;
