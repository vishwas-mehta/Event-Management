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

interface EarlyBirdConfig {
    enabled: boolean;
    quantity: number;  // Number of early bird tickets
    price: number;     // Discounted early bird price
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

    // Ticket configuration
    const [regularTicket, setRegularTicket] = useState<TicketConfig>({
        enabled: true,
        capacity: 100,
        price: 0,
    });

    const [vipTicket, setVipTicket] = useState<TicketConfig>({
        enabled: false,
        capacity: 20,
        price: 99.99,
    });

    // Early Bird for VIP
    const [earlyBird, setEarlyBird] = useState<EarlyBirdConfig>({
        enabled: false,
        quantity: 10,
        price: 49.99,
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

        // Validations
        if (!regularTicket.enabled && !vipTicket.enabled) {
            setError('Please enable at least one ticket type');
            return;
        }

        if (regularTicket.enabled && regularTicket.capacity < 1) {
            setError('Regular ticket capacity must be at least 1');
            return;
        }

        if (vipTicket.enabled) {
            if (vipTicket.capacity < 1) {
                setError('VIP ticket capacity must be at least 1');
                return;
            }
            if (vipTicket.price < 0) {
                setError('VIP ticket price cannot be negative');
                return;
            }

            // Early bird validations
            if (earlyBird.enabled) {
                if (earlyBird.quantity < 1) {
                    setError('Early bird quantity must be at least 1');
                    return;
                }
                if (earlyBird.quantity >= vipTicket.capacity) {
                    setError('Early bird quantity must be less than total VIP capacity');
                    return;
                }
                if (earlyBird.price >= vipTicket.price) {
                    setError('Early bird price should be less than regular VIP price');
                    return;
                }
                if (earlyBird.price < 0) {
                    setError('Early bird price cannot be negative');
                    return;
                }
            }
        }

        setSubmitting(true);

        // Build ticket types
        const ticketTypes: any[] = [];

        if (regularTicket.enabled) {
            ticketTypes.push({
                name: 'Regular',
                description: 'Standard entry ticket - Free admission',
                price: 0,
                capacity: regularTicket.capacity,
            });
        }

        if (vipTicket.enabled) {
            const vipTicketData: any = {
                name: 'VIP',
                description: earlyBird.enabled
                    ? `VIP access - First ${earlyBird.quantity} tickets at $${earlyBird.price.toFixed(2)}, then $${vipTicket.price.toFixed(2)}`
                    : 'VIP access with premium benefits',
                price: earlyBird.enabled ? earlyBird.price : vipTicket.price, // Start with early bird price
                capacity: vipTicket.capacity,
            };

            // Add dynamic pricing config for early bird
            if (earlyBird.enabled) {
                vipTicketData.dynamicPricing = {
                    type: 'early_bird',
                    originalPrice: vipTicket.price,  // Regular VIP price after early bird
                    earlyBirdQuantity: earlyBird.quantity,
                    earlyBirdPrice: earlyBird.price,
                };
            }

            ticketTypes.push(vipTicketData);
        }

        const totalCapacity = ticketTypes.reduce((sum, t) => sum + t.capacity, 0);

        try {
            await organizerApi.createEvent({
                ...formData,
                capacity: totalCapacity,
                ticketTypes,
            } as any);

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
                                    <small>Configure ticket types. Regular is free, VIP is paid.</small>
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
                                            onChange={(e) => {
                                                setVipTicket({ ...vipTicket, enabled: e.target.checked });
                                                if (!e.target.checked) {
                                                    setEarlyBird({ ...earlyBird, enabled: false });
                                                }
                                            }}
                                            className="mb-2"
                                        />

                                        {vipTicket.enabled && (
                                            <>
                                                <div className="mb-2">
                                                    <span className="badge bg-warning text-dark">PAID</span>
                                                </div>
                                                <Row className="mb-3">
                                                    <Col xs={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small mb-1">Total Capacity</Form.Label>
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
                                                            <Form.Label className="small mb-1">Regular Price ($)</Form.Label>
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

                                                {/* Early Bird Option */}
                                                <div className="border-top pt-2">
                                                    <Form.Check
                                                        type="switch"
                                                        id="early-bird-switch"
                                                        label={<small><strong>🐦 Early Bird Pricing</strong></small>}
                                                        checked={earlyBird.enabled}
                                                        onChange={(e) => setEarlyBird({ ...earlyBird, enabled: e.target.checked })}
                                                        className="mb-2"
                                                    />

                                                    {earlyBird.enabled && (
                                                        <div className="bg-light p-2 rounded">
                                                            <Row>
                                                                <Col xs={6}>
                                                                    <Form.Group className="mb-2">
                                                                        <Form.Label className="small mb-1">First N tickets</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            size="sm"
                                                                            min="1"
                                                                            max={vipTicket.capacity - 1}
                                                                            value={earlyBird.quantity}
                                                                            onChange={(e) => setEarlyBird({
                                                                                ...earlyBird,
                                                                                quantity: parseInt(e.target.value) || 0
                                                                            })}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col xs={6}>
                                                                    <Form.Group className="mb-2">
                                                                        <Form.Label className="small mb-1">At Price ($)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            size="sm"
                                                                            min="0"
                                                                            step="0.01"
                                                                            max={vipTicket.price - 0.01}
                                                                            value={earlyBird.price}
                                                                            onChange={(e) => setEarlyBird({
                                                                                ...earlyBird,
                                                                                price: parseFloat(e.target.value) || 0
                                                                            })}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <small className="text-muted">
                                                                First {earlyBird.quantity} VIP tickets: <strong>${earlyBird.price.toFixed(2)}</strong><br />
                                                                Remaining {vipTicket.capacity - earlyBird.quantity}: <strong>${vipTicket.price.toFixed(2)}</strong>
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
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
