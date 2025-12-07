import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { eventsApi } from '../../api/events.api';
import type { EventType, EventFilters, CategoryType } from '../../types';
import EventCard from '../../components/Events/EventCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import Pagination from '../../components/Common/Pagination';

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<EventType[]>([]);
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<EventFilters>({
        page: 1,
        limit: 12,
        sortBy: 'date',
        order: 'ASC',
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [filters]);

    const loadCategories = async () => {
        try {
            const response = await eventsApi.getCategories();
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const loadEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await eventsApi.getEvents(filters);
            setEvents(response.data.events);
            setPagination(response.data.pagination);
        } catch (err: any) {
            setError('Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof EventFilters, value: any) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
        window.scrollTo(0, 0);
    };

    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 12,
            sortBy: 'date',
            order: 'ASC',
        });
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Browse Events</h2>

            <Row>
                {/* Filters Sidebar */}
                <Col md={3} className="mb-4">
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Filters</h5>

                            <Form.Group className="mb-3">
                                <Form.Label>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search events..."
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Select
                                    value={filters.category || ''}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.slug}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Location</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="City or venue..."
                                    value={filters.location || ''}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Free events only"
                                    checked={filters.isFree || false}
                                    onChange={(e) => handleFilterChange('isFree', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Available tickets only"
                                    checked={filters.hasAvailability || false}
                                    onChange={(e) => handleFilterChange('hasAvailability', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Sort By</Form.Label>
                                <Form.Select
                                    value={filters.sortBy || 'date'}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                >
                                    <option value="date">Date</option>
                                    <option value="popularity">Popularity</option>
                                    <option value="price">Price</option>
                                </Form.Select>
                            </Form.Group>

                            <Button variant="outline-secondary" size="sm" className="w-100" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Events Grid */}
                <Col md={9}>
                    {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                    {loading ? (
                        <LoadingSpinner fullScreen={false} />
                    ) : events.length === 0 ? (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <p className="text-muted">No events found matching your criteria.</p>
                                <Button variant="primary" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {events.map((event) => (
                                    <Col key={event.id}>
                                        <EventCard event={event} />
                                    </Col>
                                ))}
                            </Row>

                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default EventsPage;
