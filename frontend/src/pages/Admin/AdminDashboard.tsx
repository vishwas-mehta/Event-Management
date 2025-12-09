import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Table, Button, Badge, Alert, Pagination } from 'react-bootstrap';
import { adminApi } from '../../api/admin.api';
import type { AdminDashboardStats, User, ReportedEvent } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { extractErrorMessage } from '../../utils/errorHelper';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
    const [reportedEvents, setReportedEvents] = useState<ReportedEvent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
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
            const [dashboardRes, organizersRes, reportsRes, usersRes] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getPendingOrganizers(),
                adminApi.getReportedEvents(),
                adminApi.getAllUsers(1, 20)
            ]);
            setStats(dashboardRes.data);
            setPendingOrganizers(organizersRes.data.organizers || []);
            setReportedEvents(reportsRes.data.reports || []);
            setUsers(usersRes.data.users || []);
            setUsersPagination(usersRes.data.pagination);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async (page: number) => {
        try {
            const usersRes = await adminApi.getAllUsers(page, 20);
            setUsers(usersRes.data.users || []);
            setUsersPagination(usersRes.data.pagination);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to load users'));
        }
    };

    const handleApproveOrganizer = async (id: string) => {
        setActionLoading(id);
        setError('');
        try {
            await adminApi.approveOrganizer(id);
            setSuccess('Organizer approved successfully!');
            setPendingOrganizers(prev => prev.filter(o => o.id !== id));
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
            const dashRes = await adminApi.getDashboard();
            setStats(dashRes.data);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to reject organizer'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateUserStatus = async (id: string, newStatus: 'active' | 'blocked') => {
        const action = newStatus === 'blocked' ? 'block' : 'unblock';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }
        setActionLoading(id);
        setError('');
        try {
            await adminApi.updateUserStatus(id, newStatus);
            setSuccess(`User ${action}ed successfully!`);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
        } catch (err) {
            setError(extractErrorMessage(err, `Failed to ${action} user`));
        } finally {
            setActionLoading(null);
        }
    };

    const handleResolveReport = async (id: string) => {
        if (!window.confirm('Mark this report as resolved?')) {
            return;
        }
        setActionLoading(id);
        setError('');
        try {
            await adminApi.resolveReport(id);
            setSuccess('Report resolved!');
            setReportedEvents(prev => prev.filter(r => r.id !== id));
            const dashRes = await adminApi.getDashboard();
            setStats(dashRes.data);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to resolve report'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteEvent = async (eventId: string, reportId: string) => {
        if (!window.confirm('Are you sure you want to DELETE this event? This cannot be undone.')) {
            return;
        }
        setActionLoading(reportId);
        setError('');
        try {
            await adminApi.deleteEvent(eventId);
            await adminApi.resolveReport(reportId);
            setSuccess('Event deleted and report resolved!');
            setReportedEvents(prev => prev.filter(r => r.id !== reportId));
            const dashRes = await adminApi.getDashboard();
            setStats(dashRes.data);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to delete event'));
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge bg="success">Active</Badge>;
            case 'blocked': return <Badge bg="danger">Blocked</Badge>;
            case 'pending': return <Badge bg="warning">Pending</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge bg="dark">Admin</Badge>;
            case 'organizer': return <Badge bg="primary">Organizer</Badge>;
            case 'attendee': return <Badge bg="info">Attendee</Badge>;
            default: return <Badge bg="secondary">{role}</Badge>;
        }
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
                                            <Badge bg="warning" className="ms-2">!</Badge>
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
                                            <Badge bg="danger" className="ms-2">!</Badge>
                                        )}
                                    </h2>
                                    <p className="text-muted mb-0">Reported Events</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* Users Tab */}
                <Tab eventKey="users" title="All Users">
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <strong>User Management</strong>
                            <span className="text-muted">Total: {usersPagination.total}</span>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.firstName} {user.lastName}</td>
                                            <td>{user.email}</td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>{getStatusBadge(user.status)}</td>
                                            <td>{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                                            <td>
                                                {user.role !== 'admin' && (
                                                    user.status === 'blocked' ? (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleUpdateUserStatus(user.id, 'active')}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            {actionLoading === user.id ? '...' : 'Unblock'}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleUpdateUserStatus(user.id, 'blocked')}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            {actionLoading === user.id ? '...' : 'Block'}
                                                        </Button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {usersPagination.totalPages > 1 && (
                                <div className="d-flex justify-content-center">
                                    <Pagination>
                                        <Pagination.Prev
                                            disabled={usersPagination.page === 1}
                                            onClick={() => loadUsers(usersPagination.page - 1)}
                                        />
                                        {Array.from({ length: Math.min(5, usersPagination.totalPages) }, (_, i) => (
                                            <Pagination.Item
                                                key={i + 1}
                                                active={usersPagination.page === i + 1}
                                                onClick={() => loadUsers(i + 1)}
                                            >
                                                {i + 1}
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Next
                                            disabled={usersPagination.page === usersPagination.totalPages}
                                            onClick={() => loadUsers(usersPagination.page + 1)}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
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
                                            <th>Actions</th>
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
                                                <td>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleResolveReport(report.id)}
                                                        disabled={actionLoading === report.id}
                                                    >
                                                        Dismiss
                                                    </Button>
                                                    {report.event && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteEvent(report.event!.id, report.id)}
                                                            disabled={actionLoading === report.id}
                                                        >
                                                            Delete Event
                                                        </Button>
                                                    )}
                                                </td>
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
