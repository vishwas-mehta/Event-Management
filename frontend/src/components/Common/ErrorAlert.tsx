import React from 'react';
import { Alert } from 'react-bootstrap';

interface ErrorAlertProps {
    message: string;
    onClose?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
    return (
        <Alert variant="danger" dismissible={!!onClose} onClose={onClose}>
            <Alert.Heading>Error</Alert.Heading>
            <p>{message}</p>
        </Alert>
    );
};

export default ErrorAlert;
