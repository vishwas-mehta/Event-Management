import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        switch (user.role) {
            case UserRole.ADMIN:
                return '/admin/dashboard';
            case UserRole.ORGANIZER:
                return '/organizer/dashboard';
            case UserRole.ATTENDEE:
                return '/attendee/dashboard';
            default:
                return '/';
        }
    };

    return (
        <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/" style={{ fontWeight: 800, fontSize: '1.5rem' }}>
                    EventHub
                </BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-lg-center" style={{ gap: '0.25rem' }}>
                        <Nav.Link as={Link} to="/events">
                            Browse Events
                        </Nav.Link>

                        {user ? (
                            <>
                                <Nav.Link as={Link} to={getDashboardLink()}>
                                    Dashboard
                                </Nav.Link>

                                {user.role === UserRole.ORGANIZER && user.status === 'active' && (
                                    <Nav.Link as={Link} to="/organizer/events/create">
                                        Create Event
                                    </Nav.Link>
                                )}

                                {user.role === UserRole.ATTENDEE && (
                                    <Nav.Link as={Link} to="/attendee/bookings">
                                        My Bookings
                                    </Nav.Link>
                                )}

                                {user.role === UserRole.ADMIN && (
                                    <Nav.Link as={Link} to="/admin/organizers/pending">
                                        Pending Approvals
                                    </Nav.Link>
                                )}

                                <NavDropdown
                                    title={
                                        <span>
                                            {user.firstName} {user.lastName}
                                        </span>
                                    }
                                    id="user-dropdown"
                                    align="end"
                                >
                                    <NavDropdown.ItemText>
                                        <small className="text-muted d-block">Signed in as</small>
                                        <strong>{user.email}</strong>
                                        <div className="mt-1">
                                            <Badge bg={user.role === UserRole.ADMIN ? 'danger' : user.role === UserRole.ORGANIZER ? 'warning' : 'info'} className="text-uppercase" style={{ fontSize: '0.7rem' }}>
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </NavDropdown.ItemText>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item as={Link} to="/profile">
                                        Edit Profile
                                    </NavDropdown.Item>
                                    <NavDropdown.Item onClick={handleLogout} className="text-danger">
                                        Logout
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">
                                    Login
                                </Nav.Link>
                                <Link to="/register" className="btn btn-primary ms-2" style={{ fontSize: '0.938rem' }}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};

export default Navbar;
