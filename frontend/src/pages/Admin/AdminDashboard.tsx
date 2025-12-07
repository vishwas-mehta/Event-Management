import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { adminApi } from '../../api/admin.api';
import type { AdminDashboardStats } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await adminApi.getDashboard();
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Admin Dashboard</h2>

            <Row>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.totalUsers || 0}</h3>
                            <p className="text-muted mb-0">Total Users</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.totalEvents || 0}</h3>
                            <p className="text-muted mb-0">Total Events</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.pendingOrganizers || 0}</h3>
                            <p className="text-muted mb-0">Pending Organizers</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.totalOrganizers || 0}</h3>
                            <p className="text-muted mb-0">Total Organizers</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.totalAttendees || 0}</h3>
                            <p className="text-muted mb-0">Total Attendees</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="stat-card">
                        <Card.Body>
                            <h3>{stats?.reportedEvents || 0}</h3>
                            <p className="text-muted mb-0">Reported Events</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboard;
