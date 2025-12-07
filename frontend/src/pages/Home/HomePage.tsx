import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const HomePage: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            {/* Hero Section */}
            <div className="hero-section text-center">
                <Container>
                    <div className="fade-in-up">
                        <h1 className="display-3 fw-bold mb-4">
                            Discover & Book<br />
                            Amazing Events
                        </h1>
                        <p className="lead">
                            From local meetups to grand conferences, find and book tickets<br />
                            for the best events happening around you.
                        </p>
                        <div className="d-flex gap-3 justify-content-center flex-wrap mt-4">
                            <Button as={Link} to="/events" variant="primary" size="lg">
                                Explore Events
                            </Button>
                            {!user && (
                                <Button as={Link} to="/register" variant="outline-primary" size="lg">
                                    Start for Free
                                </Button>
                            )}
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-5 d-flex justify-content-center gap-5 flex-wrap" style={{ opacity: 0.7 }}>
                            <div className="text-muted small">
                                <strong style={{ fontSize: '1.5rem', display: 'block' }}>10,000+</strong>
                                Active Users
                            </div>
                            <div className="text-muted small">
                                <strong style={{ fontSize: '1.5rem', display: 'block' }}>5,000+</strong>
                                Events
                            </div>
                            <div className="text-muted small">
                                <strong style={{ fontSize: '1.5rem', display: 'block' }}>200+</strong>
                                Cities
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Features Section */}
            <Container className="py-5 my-5">
                <Row className="text-center mb-5">
                    <Col>
                        <h2 className="mb-3">Everything you need to find your next event</h2>
                        <p className="text-muted lead">Powerful features to make event discovery effortless</p>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col md={4}>
                        <Card className="border-0 h-100 p-4">
                            <div className="mb-4">
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-search" style={{ fontSize: '2rem', color: 'white' }}></i>
                                </div>
                            </div>
                            <h5 className="mb-3">Advanced Search</h5>
                            <p className="text-muted mb-0">
                                Filter by category, location, date, price, and more. Find exactly what you're looking for in seconds.
                            </p>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="border-0 h-100 p-4">
                            <div className="mb-4">
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-ticket-perforated" style={{ fontSize: '2rem', color: 'white' }}></i>
                                </div>
                            </div>
                            <h5 className="mb-3">Instant Booking</h5>
                            <p className="text-muted mb-0">
                                Book tickets instantly with our streamlined checkout. Support for multiple ticket types and quantities.
                            </p>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="border-0 h-100 p-4">
                            <div className="mb-4">
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-star-fill" style={{ fontSize: '2rem', color: 'white' }}></i>
                                </div>
                            </div>
                            <h5 className="mb-3">Verified Reviews</h5>
                            <p className="text-muted mb-0">
                                Read authentic reviews from verified attendees. Make informed decisions about which events to attend.
                            </p>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* How It Works */}
            <div style={{ background: 'var(--gray-100)', padding: '80px 0' }}>
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className="mb-3">How it works</h2>
                            <p className="text-muted lead">Get started in three simple steps</p>
                        </Col>
                    </Row>

                    <Row className="g-5">
                        <Col md={4} className="text-center">
                            <div className="mb-4">
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    boxShadow: 'var(--shadow-lg)',
                                    fontSize: '2rem',
                                    fontWeight: '900',
                                    color: 'var(--primary)'
                                }}>
                                    1
                                </div>
                            </div>
                            <h5 className="mb-3">Browse Events</h5>
                            <p className="text-muted">
                                Explore thousands of events across different categories and locations
                            </p>
                        </Col>

                        <Col md={4} className="text-center">
                            <div className="mb-4">
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignments: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    boxShadow: 'var(--shadow-lg)',
                                    fontSize: '2rem',
                                    fontWeight: '900',
                                    color: 'var(--primary)'
                                }}>
                                    2
                                </div>
                            </div>
                            <h5 className="mb-3">Book Tickets</h5>
                            <p className="text-muted">
                                Choose your tickets, select quantity, and complete your booking
                            </p>
                        </Col>

                        <Col md={4} className="text-center">
                            <div className="mb-4">
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    boxShadow: 'var(--shadow-lg)',
                                    fontSize: '2rem',
                                    fontWeight: '900',
                                    color: 'var(--primary)'
                                }}>
                                    3
                                </div>
                            </div>
                            <h5 className="mb-3">Enjoy & Review</h5>
                            <p className="text-muted">
                                Attend amazing events and share your experience with others
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* CTA Section */}
            <Container className="py-5 my-5">
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <Card className="border-0 text-center p-5" style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white'
                        }}>
                            <h2 className="mb-4 fw-bold" style={{ color: 'white' }}>Ready to discover your next adventure?</h2>
                            <p className="lead mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Join thousands of event enthusiasts and start exploring today
                            </p>
                            <div className="d-flex gap-3 justify-content-center">
                                <Button as={Link} to="/events" variant="light" size="lg">
                                    Explore Events
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default HomePage;
