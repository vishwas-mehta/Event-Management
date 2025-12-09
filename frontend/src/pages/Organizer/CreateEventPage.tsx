import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { organizerApi } from '../../api/organizer.api';
import { eventsApi } from '../../api/events.api';
import type { CategoryType } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import { extractErrorMessage } from '../../utils/errorHelper';

interface TicketConfig {
    enabled: boolean;
    capacity: number;
    price: number;
}

const CreateEventPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    // Ticket configuration state
    const [regularTicket, setRegularTicket] = useState<TicketConfig>({
        enabled: true,
        capacity: 100,
        price: 0, // Always free
    });

    const [vipTicket, setVipTicket] = useState<TicketConfig>({
        enabled: false,
        capacity: 20,
        price: 99.99,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await eventsApi.getCategories();
            setCategories(response.data.categories);
            if (response.data.categories.length > 0) {
                setFormData((prev) => ({ ...prev, categoryId: response.data.categories[0].id }));
            }
        } catch (err) {
            setError('Failed to load categories');
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

        // Validate at least one ticket type is enabled
        if (!regularTicket.enabled && !vipTicket.enabled) {
            setError('Please enable at least one ticket type (Regular or VIP)');
            return;
        }

        // Validate capacities
        if (regularTicket.enabled && regularTicket.capacity < 1) {
            setError('Regular ticket capacity must be at least 1');
            return;
        }
        if (vipTicket.enabled && vipTicket.capacity < 1) {
            setError('VIP ticket capacity must be at least 1');
            return;
        }
        if (vipTicket.enabled && vipTicket.price < 0) {
            setError('VIP ticket price cannot be negative');
            return;
        }

        setSubmitting(true);

        // Build ticket types array
        const ticketTypes: { name: string; description: string; price: number; capacity: number }[] = [];

        if (regularTicket.enabled) {
            ticketTypes.push({
                name: 'Regular',
                description: 'Standard entry ticket - Free admission',
                price: 0,
                capacity: regularTicket.capacity,
            });
        }

        if (vipTicket.enabled) {
            ticketTypes.push({
                name: 'VIP',
                description: 'VIP access with premium benefits',
                price: vipTicket.price,
                capacity: vipTicket.capacity,
            });
        }

        // Calculate total capacity
        const totalCapacity = ticketTypes.reduce((sum, t) => sum + t.capacity, 0);

        try {
            await organizerApi.createEvent({
                ...formData,
                capacity: totalCapacity,
                ticketTypes,
            });

            navigate('/organizer/dashboard');
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to create event. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Create New Event</h2>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <Form onSubmit={handleSubmit}>
                <Row>
                    {/* Left Column - Event Details */}
                    <Col lg={8}>
                        <Card className="mb-4">
                            <Card.Header><strong>Event Details</strong></Card.Header>
                            <Card.Body>
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
                                        placeholder="City, Venue name"
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
                                        placeholder="Full address (optional)"
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
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
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="checkbox"
                                                name="isPublished"
                                                label="Publish immediately"
                                                checked={formData.isPublished}
                                                onChange={handleChange}
                                                className="mt-4"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Media Section */}
                        <Card className="mb-4">
                            <Card.Header><strong>Media (Optional)</strong></Card.Header>
                            <Card.Body>
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
                                    <Form.Label>Teaser Video URL</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="teaserVideo"
                                        value={formData.teaserVideo}
                                        onChange={handleChange}
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column - Ticket Configuration */}
                    <Col lg={4}>
                        <Card className="mb-4" style={{ position: 'sticky', top: '80px' }}>
                            <Card.Header className="bg-primary text-white">
                                <strong>🎫 Ticket Configuration</strong>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="info" className="py-2 mb-3">
                                    <small>Configure ticket types for your event. Regular tickets are free, VIP tickets have a price.</small>
                                </Alert>

                                {/* Regular Ticket */}
                                <Card className={`mb-3 ${regularTicket.enabled ? 'border-success' : ''}`}>
                                    <Card.Body className="py-3">
                                        <Form.Check
                                            type="switch"
                                            id="regular-ticket-switch"
                                            label={<strong>Regular Ticket</strong>}
                                            checked={regularTicket.enabled}
                                            onChange={(e) => setRegularTicket({ ...regularTicket, enabled: e.target.checked })}
                                            className="mb-2"
                                        />

                                        {regularTicket.enabled && (
                                            <>
                                                <div className="mb-2">
                                                    <span className="badge bg-success">FREE</span>
                                                </div>
                                                <Form.Group>
                                                    <Form.Label className="small mb-1">Capacity</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        size="sm"
                                                        min="1"
                                                        value={regularTicket.capacity}
                                                        onChange={(e) => setRegularTicket({
                                                            ...regularTicket,
                                                            capacity: parseInt(e.target.value) || 0
                                                        })}
                                                    />
                                                </Form.Group>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* VIP Ticket */}
                                <Card className={`mb-3 ${vipTicket.enabled ? 'border-warning' : ''}`}>
                                    <Card.Body className="py-3">
                                        <Form.Check
                                            type="switch"
                                            id="vip-ticket-switch"
                                            label={<strong>VIP Ticket</strong>}
                                            checked={vipTicket.enabled}
                                            onChange={(e) => setVipTicket({ ...vipTicket, enabled: e.target.checked })}
                                            className="mb-2"
                                        />

                                        {vipTicket.enabled && (
                                            <>
                                                <div className="mb-2">
                                                    <span className="badge bg-warning text-dark">PAID</span>
                                                </div>
                                                <Row>
                                                    <Col xs={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small mb-1">Capacity</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                min="1"
                                                                value={vipTicket.capacity}
                                                                onChange={(e) => setVipTicket({
                                                                    ...vipTicket,
                                                                    capacity: parseInt(e.target.value) || 0
                                                                })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small mb-1">Price ($)</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                min="0"
                                                                step="0.01"
                                                                value={vipTicket.price}
                                                                onChange={(e) => setVipTicket({
                                                                    ...vipTicket,
                                                                    price: parseFloat(e.target.value) || 0
                                                                })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Capacity Summary */}
                                <div className="bg-light p-2 rounded mb-3">
                                    <small className="text-muted d-block">Total Event Capacity:</small>
                                    <strong>
                                        {(regularTicket.enabled ? regularTicket.capacity : 0) +
                                            (vipTicket.enabled ? vipTicket.capacity : 0)} seats
                                    </strong>
                                </div>

                                <hr />

                                <div className="d-grid gap-2">
                                    <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                                        {submitting ? 'Creating...' : 'Create Event'}
                                    </Button>
                                    <Button variant="outline-secondary" onClick={() => navigate('/organizer/dashboard')}>
                                        Cancel
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default CreateEventPage;
