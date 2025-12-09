import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { extractErrorMessage } from '../../utils/errorHelper';

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authApi.updateProfile(formData);
            updateUser(response.data.user);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update profile'));
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <LoadingSpinner />;

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Header>
                            <h4 className="mb-0">Edit Profile</h4>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="bg-light"
                                    />
                                    <Form.Text className="text-muted">
                                        Email cannot be changed
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        disabled
                                        className="bg-light"
                                    />
                                </Form.Group>

                                <hr />

                                <Form.Group className="mb-3">
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProfilePage;
