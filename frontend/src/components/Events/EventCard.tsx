import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Event } from '../../types';
import { formatEventDateTime } from '../../utils/dateFormat';
import { formatPriceRange } from '../../utils/priceFormat';

interface EventCardProps {
    event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const getPriceRange = () => {
        if (!event.ticketTypes || event.ticketTypes.length === 0) {
            return 'TBA';
        }
        const prices = event.ticketTypes.map(t => t.price);
        return formatPriceRange(Math.min(...prices), Math.max(...prices));
    };

    const hasAvailableTickets = () => {
        if (!event.ticketTypes) return false;
        return event.ticketTypes.some(t => (t.capacity - t.sold) > 0);
    };

    const isFree = getPriceRange() === 'Free';

    return (
        <Link to={`/events/${event.id}`} className="text-decoration-none">
            <Card className="event-card h-100">
                <div style={{ position: 'relative', overflow: 'hidden', background: '#f3f4f6' }}>
                    <Card.Img
                        variant="top"
                        src={event.bannerImage || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=350&fit=crop&q=80`}
                        alt={event.title}
                        className="event-card-image"
                        onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=350&fit=crop&q=80';
                        }}
                    />
                    {!hasAvailableTickets() && (
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(239, 68, 68, 0.95)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            backdropFilter: 'blur(8px)'
                        }}>
                            SOLD OUT
                        </div>
                    )}
                </div>
                <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Badge
                            bg="secondary"
                            style={{
                                background: 'var(--gray-100)',
                                color: 'var(--gray-700)',
                                fontWeight: '600',
                                fontSize: '0.813rem',
                                padding: '0.375rem 0.75rem',
                                border: '1px solid var(--gray-200)'
                            }}
                        >
                            {event.category?.name || 'General'}
                        </Badge>
                        <span style={{
                            background: isFree ? '#ecfdf5' : '#eff6ff',
                            color: isFree ? '#065f46' : '#1e40af',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            border: `1px solid ${isFree ? '#a7f3d0' : '#bfdbfe'}`
                        }}>
                            {getPriceRange()}
                        </span>
                    </div>

                    <h5 className="mb-3" style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        lineHeight: '1.4',
                        minHeight: '50px',
                        color: 'var(--gray-900)'
                    }}>
                        {event.title}
                    </h5>

                    <div className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                        <i className="bi bi-calendar3 me-2" style={{ color: 'var(--primary)' }}></i>
                        {formatEventDateTime(event.startDateTime)}
                    </div>

                    <div className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                        <i className="bi bi-geo-alt me-2" style={{ color: 'var(--accent)' }}></i>
                        {event.location}
                    </div>

                    <p className="text-muted flex-grow-1" style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {event.description}
                    </p>

                    {event.averageRating && event.averageRating > 0 && (
                        <div className="d-flex align-items-center" style={{ fontSize: '0.875rem' }}>
                            <div className="me-2" style={{ color: '#f59e0b' }}>
                                {[...Array(5)].map((_, i) => (
                                    <i
                                        key={i}
                                        className={`bi bi-star${i < Math.floor(event.averageRating!) ? '-fill' : ''}`}
                                        style={{ fontSize: '0.875rem' }}
                                    ></i>
                                ))}
                            </div>
                            <span className="text-muted">
                                <strong>{event.averageRating.toFixed(1)}</strong>
                                {event.totalReviews && ` (${event.totalReviews})`}
                            </span>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Link>
    );
};

export default EventCard;
