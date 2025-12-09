import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Table, Button, Badge, Alert } from 'react-bootstrap';
import { adminApi } from '../../api/admin.api';
import type { AdminDashboardStats, User, ReportedEvent } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { extractErrorMessage } from '../../utils/errorHelper';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
    const [reportedEvents, setReportedEvents] = useState<ReportedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [dashboardRes, organizersRes, reportsRes] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getPendingOrganizers(),
                adminApi.getReportedEvents()
            ]);
            setStats(dashboardRes.data);
            setPendingOrganizers(organizersRes.data.organizers || []);
            setReportedEvents(reportsRes.data.reports || []);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveOrganizer = async (id: string) => {
        setActionLoading(id);
        setError('');
        try {
            await adminApi.approveOrganizer(id);
            setSuccess('Organizer approved successfully!');
            setPendingOrganizers(prev => prev.filter(o => o.id !== id));
            // Refresh stats
            const dashRes = await adminApi.getDashboard();
            setStats(dashRes.data);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to approve organizer'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectOrganizer = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject this organizer? Their account will be deleted.')) {
            return;
        }
        setActionLoading(id);
        setError('');
        try {
            await adminApi.rejectOrganizer(id);
            setSuccess('Organizer rejected and account deleted.');
            setPendingOrganizers(prev => prev.filter(o => o.id !== id));
            // Refresh stats
            const dashRes = await adminApi.getDashboard();
            setStats(dashRes.data);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to reject organizer'));
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Admin Dashboard</h2>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Tabs defaultActiveKey="overview" className="mb-4">
                {/* Overview Tab */}
                <Tab eventKey="overview" title="Overview">
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100">
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">{stats?.totalUsers || 0}</h2>
                                    <p className="text-muted mb-0">Total Users</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100">
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">{stats?.totalEvents || 0}</h2>
                                    <p className="text-muted mb-0">Total Events</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100" style={{ borderColor: stats?.pendingOrganizers ? '#ffc107' : '' }}>
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">
                                        {stats?.pendingOrganizers || 0}
                                        {(stats?.pendingOrganizers || 0) > 0 && (
                                            <Badge bg="warning" className="ms-2">Action Required</Badge>
                                        )}
                                    </h2>
                                    <p className="text-muted mb-0">Pending Organizers</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100">
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">{stats?.totalOrganizers || 0}</h2>
                                    <p className="text-muted mb-0">Active Organizers</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100">
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">{stats?.totalAttendees || 0}</h2>
                                    <p className="text-muted mb-0">Total Attendees</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="stat-card h-100" style={{ borderColor: stats?.reportedEvents ? '#dc3545' : '' }}>
                                <Card.Body className="text-center">
                                    <h2 className="mb-1">
                                        {stats?.reportedEvents || 0}
                                        {(stats?.reportedEvents || 0) > 0 && (
                                            <Badge bg="danger" className="ms-2">Review</Badge>
                                        )}
                                    </h2>
                                    <p className="text-muted mb-0">Reported Events</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* Pending Organizers Tab */}
                <Tab
                    eventKey="organizers"
                    title={
                        <>
                            Pending Organizers
                            {pendingOrganizers.length > 0 && (
                                <Badge bg="warning" className="ms-2">{pendingOrganizers.length}</Badge>
                            )}
                        </>
                    }
                >
                    <Card>
                        <Card.Header>
                            <strong>Organizers Awaiting Approval</strong>
                        </Card.Header>
                        <Card.Body>
                            {pendingOrganizers.length === 0 ? (
                                <p className="text-muted text-center mb-0">
                                    ✅ No pending organizers to review.
                                </p>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Registered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingOrganizers.map(org => (
                                            <tr key={org.id}>
                                                <td>{org.firstName} {org.lastName}</td>
                                                <td>{org.email}</td>
                                                <td>{org.phoneNumber || '-'}</td>
                                                <td>{org.createdAt ? formatDate(org.createdAt) : '-'}</td>
                                                <td>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleApproveOrganizer(org.id)}
                                                        disabled={actionLoading === org.id}
                                                    >
                                                        {actionLoading === org.id ? '...' : 'Approve'}
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRejectOrganizer(org.id)}
                                                        disabled={actionLoading === org.id}
                                                    >
                                                        Reject
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Reported Events Tab */}
                <Tab
                    eventKey="reports"
                    title={
                        <>
                            Reported Events
                            {reportedEvents.length > 0 && (
                                <Badge bg="danger" className="ms-2">{reportedEvents.length}</Badge>
                            )}
                        </>
                    }
                >
                    <Card>
                        <Card.Header>
                            <strong>Events Reported by Users</strong>
                        </Card.Header>
                        <Card.Body>
                            {reportedEvents.length === 0 ? (
                                <p className="text-muted text-center mb-0">
                                    ✅ No reported events to review.
                                </p>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Event</th>
                                            <th>Organizer</th>
                                            <th>Reported By</th>
                                            <th>Reason</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportedEvents.map(report => (
                                            <tr key={report.id}>
                                                <td>{report.event?.title || 'Unknown'}</td>
                                                <td>
                                                    {report.event?.organizer
                                                        ? `${report.event.organizer.firstName} ${report.event.organizer.lastName}`
                                                        : '-'
                                                    }
                                                </td>
                                                <td>
                                                    {report.reportedBy
                                                        ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
                                                        : '-'
                                                    }
                                                </td>
                                                <td>{report.reason}</td>
                                                <td>{formatDate(report.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default AdminDashboard;
