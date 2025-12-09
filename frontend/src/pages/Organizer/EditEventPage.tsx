import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Table, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { organizerApi } from '../../api/organizer.api';
import { eventsApi } from '../../api/events.api';
import type { CategoryType, EventType, TicketType } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import { extractErrorMessage } from '../../utils/errorHelper';

interface TicketEditState {
    [ticketId: string]: {
        capacity: number;
        price: number;
        saving: boolean;
    };
}

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
    const [ticketEdits, setTicketEdits] = useState<TicketEditState>({});

    // For adding new ticket
    const [showAddTicket, setShowAddTicket] = useState(false);
    const [newTicket, setNewTicket] = useState({ name: '', capacity: 50, price: 0 });
    const [addingTicket, setAddingTicket] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        address: '',
        categoryId: '',
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

            // Initialize ticket edit states
            const ticketStates: TicketEditState = {};
            if (eventData.ticketTypes) {
                eventData.ticketTypes.forEach((t: TicketType) => {
                    ticketStates[t.id] = {
                        capacity: t.capacity,
                        price: Number(t.price),
                        saving: false,
                    };
                });
            }
            setTicketEdits(ticketStates);

            // Load attendees
            try {
                const attendeesRes = await organizerApi.getEventAttendees(id!);
                setAttendees(attendeesRes.data.attendees || []);
            } catch {
                setAttendees([]);
            }

            // Format dates for input
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
            await organizerApi.updateEvent(id!, formData);
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

    // Ticket editing handlers
    const handleTicketChange = (ticketId: string, field: 'capacity' | 'price', value: number) => {
        setTicketEdits(prev => ({
            ...prev,
            [ticketId]: {
                ...prev[ticketId],
                [field]: value,
            }
        }));
    };

    const handleSaveTicket = async (ticketId: string) => {
        const edits = ticketEdits[ticketId];
        if (!edits) return;

        setTicketEdits(prev => ({
            ...prev,
            [ticketId]: { ...prev[ticketId], saving: true }
        }));
        setError('');

        try {
            await organizerApi.updateTicketType(id!, ticketId, {
                capacity: edits.capacity,
                price: edits.price,
            });
            setSuccess('Ticket updated!');
            setTimeout(() => setSuccess(''), 2000);
            loadData();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update ticket'));
        } finally {
            setTicketEdits(prev => ({
                ...prev,
                [ticketId]: { ...prev[ticketId], saving: false }
            }));
        }
    };

    const handleAddTicket = async () => {
        if (!newTicket.name.trim() || newTicket.capacity < 1) {
            setError('Please enter a valid ticket name and capacity');
            return;
        }

        setAddingTicket(true);
        setError('');

        try {
            await organizerApi.createTicketType(id!, {
                name: newTicket.name,
                description: '',
                price: newTicket.price,
                capacity: newTicket.capacity,
            });
            setSuccess('Ticket type added!');
            setNewTicket({ name: '', capacity: 50, price: 0 });
            setShowAddTicket(false);
            loadData();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to add ticket type'));
        } finally {
            setAddingTicket(false);
        }
    };

    const handleDeleteTicket = async (ticketId: string, ticketName: string) => {
        if (!window.confirm(`Delete "${ticketName}" ticket type? This cannot be undone.`)) {
            return;
        }

        try {
            await organizerApi.deleteTicketType(id!, ticketId);
            setSuccess('Ticket type deleted');
            loadData();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to delete ticket. It may have bookings.'));
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!event) return <Container className="py-4"><Alert variant="danger">Event not found</Alert></Container>;

    const totalCapacity = event.ticketTypes?.reduce((sum, t) => sum + t.capacity, 0) || 0;
    const totalSold = event.ticketTypes?.reduce((sum, t) => sum + t.sold, 0) || 0;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Edit Event</h2>
                <div>
                    <Button variant="danger" className="me-2" onClick={handleDelete} disabled={deleting}>
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

                {/* Tickets Tab */}
                <Tab eventKey="tickets" title={<>🎫 Tickets <Badge bg="secondary">{event.ticketTypes?.length || 0}</Badge></>}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <strong>Ticket Types</strong>
                            <div>
                                <span className="me-3 text-muted">
                                    Total: {totalSold} / {totalCapacity} sold
                                </span>
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => setShowAddTicket(!showAddTicket)}
                                >
                                    + Add Ticket Type
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {/* Add New Ticket Form */}
                            {showAddTicket && (
                                <Card className="mb-4 border-success">
                                    <Card.Body>
                                        <h6>Add New Ticket Type</h6>
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small">Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        size="sm"
                                                        value={newTicket.name}
                                                        onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                                                        placeholder="e.g., VIP, Early Bird"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small">Capacity</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        size="sm"
                                                        min="1"
                                                        value={newTicket.capacity}
                                                        onChange={(e) => setNewTicket({ ...newTicket, capacity: parseInt(e.target.value) || 0 })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small">Price ($)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        size="sm"
                                                        min="0"
                                                        step="0.01"
                                                        value={newTicket.price}
                                                        onChange={(e) => setNewTicket({ ...newTicket, price: parseFloat(e.target.value) || 0 })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={2} className="d-flex align-items-end mb-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="w-100"
                                                    onClick={handleAddTicket}
                                                    disabled={addingTicket}
                                                >
                                                    {addingTicket ? '...' : 'Add'}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Existing Tickets */}
                            {event.ticketTypes && event.ticketTypes.length > 0 ? (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Ticket Type</th>
                                            <th>Price</th>
                                            <th>Capacity</th>
                                            <th>Sold</th>
                                            <th>Available</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {event.ticketTypes.map((ticket: TicketType) => {
                                            const edits = ticketEdits[ticket.id] || { capacity: ticket.capacity, price: Number(ticket.price), saving: false };
                                            const hasChanges = edits.capacity !== ticket.capacity || edits.price !== Number(ticket.price);

                                            return (
                                                <tr key={ticket.id}>
                                                    <td>
                                                        <strong>{ticket.name}</strong>
                                                        {Number(ticket.price) === 0 && (
                                                            <Badge bg="success" className="ms-2">FREE</Badge>
                                                        )}
                                                    </td>
                                                    <td style={{ width: '120px' }}>
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            min="0"
                                                            step="0.01"
                                                            value={edits.price}
                                                            onChange={(e) => handleTicketChange(ticket.id, 'price', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td style={{ width: '100px' }}>
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            min={ticket.sold}
                                                            value={edits.capacity}
                                                            onChange={(e) => handleTicketChange(ticket.id, 'capacity', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>{ticket.sold}</td>
                                                    <td>
                                                        <Badge bg={ticket.capacity - ticket.sold > 0 ? 'success' : 'danger'}>
                                                            {ticket.capacity - ticket.sold}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {hasChanges && (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => handleSaveTicket(ticket.id)}
                                                                disabled={edits.saving}
                                                            >
                                                                {edits.saving ? '...' : 'Save'}
                                                            </Button>
                                                        )}
                                                        {ticket.sold === 0 && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteTicket(ticket.id, ticket.name)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            ) : (
                                <Alert variant="warning">
                                    No ticket types! Add at least one ticket type for users to book.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Attendees Tab */}
                <Tab eventKey="attendees" title={<>Attendees <Badge bg="secondary">{attendees.length}</Badge></>}>
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
        </Container>
    );
};

export default EditEventPage;
