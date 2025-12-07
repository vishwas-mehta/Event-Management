import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert } from 'react-bootstrap';
import { adminApi } from '../../api/admin.api';
import type { User } from '../../types';
import { extractErrorMessage } from '../../utils/errorHelper';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const PendingOrganizersPage: React.FC = () => {
    const [organizers, setOrganizers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadPendingOrganizers();
    }, []);

    const loadPendingOrganizers = async () => {
        try {
            const response = await adminApi.getPendingOrganizers();
            setOrganizers(response.data.organizers);
        } catch (err) {
            setError('Failed to load pending organizers');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        setError('');
        try {
            await adminApi.approveOrganizer(id);
            setSuccess('Organizer approved successfully');
            loadPendingOrganizers();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to approve organizer'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this organizer?')) return;

        setActionLoading(id);
        setError('');
        try {
            await adminApi.rejectOrganizer(id);
            setSuccess('Organizer rejected');
            loadPendingOrganizers();
        } catch (err: any) {
            setError(extractErrorMessage(err, 'Failed to reject organizer'));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Pending Organizer Approvals</h2>

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {organizers.length === 0 ? (
                        <p className="text-muted text-center">No pending organizer approvals</p>
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
                                {organizers.map((org) => (
                                    <tr key={org.id}>
                                        <td>{org.firstName} {org.lastName}</td>
                                        <td>{org.email}</td>
                                        <td>{org.phoneNumber || '-'}</td>
                                        <td>{new Date(org.createdAt || '').toLocaleDateString()}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleApprove(org.id)}
                                                    disabled={actionLoading === org.id}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleReject(org.id)}
                                                    disabled={actionLoading === org.id}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PendingOrganizersPage;
