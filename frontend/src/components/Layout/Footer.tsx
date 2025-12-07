import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="mt-auto py-5">
            <Container>
                <Row className="g-4">
                    <Col md={4}>
                        <h5 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: '800' }}>EventHub</h5>
                        <p className="text-muted" style={{ fontSize: '0.938rem' }}>
                            Discover and book tickets for amazing events happening around you.
                        </p>
                        <div className="d-flex gap-3 mt-3">
                            <a href="#" style={{ color: 'var(--gray-400)', fontSize: '1.25rem' }}>
                                <i className="bi bi-twitter"></i>
                            </a>
                            <a href="#" style={{ color: 'var(--gray-400)', fontSize: '1.25rem' }}>
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a href="#" style={{ color: 'var(--gray-400)', fontSize: '1.25rem' }}>
                                <i className="bi bi-instagram"></i>
                            </a>
                        </div>
                    </Col>

                    <Col md={2}>
                        <h6 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</h6>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <Link to="/events" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Browse Events
                                </Link>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Features
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Pricing
                                </a>
                            </li>
                        </ul>
                    </Col>

                    <Col md={2}>
                        <h6 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</h6>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    About
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Blog
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Careers
                                </a>
                            </li>
                        </ul>
                    </Col>

                    <Col md={2}>
                        <h6 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</h6>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Help Center
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Contact
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Status
                                </a>
                            </li>
                        </ul>
                    </Col>

                    <Col md={2}>
                        <h6 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</h6>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Privacy
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Terms
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.938rem' }}>
                                    Cookies
                                </a>
                            </li>
                        </ul>
                    </Col>
                </Row>

                <hr style={{ margin: '3rem 0 1.5rem', borderColor: 'var(--gray-800)' }} />

                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        © {new Date().getFullYear()} EventHub. All rights reserved.
                    </p>
                    <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        Made with ❤️ for event enthusiasts
                    </p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
