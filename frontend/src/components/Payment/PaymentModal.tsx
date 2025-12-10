import React, { useState } from 'react';
import { Modal, Button, Form, Card, Row, Col, Badge } from 'react-bootstrap';
import { formatPrice } from '../../utils/priceFormat';
import './PaymentModal.css';

interface PaymentModalProps {
    show: boolean;
    onHide: () => void;
    ticketName: string;
    ticketPrice: number;
    quantity: number;
    eventName: string;
    onPaymentComplete: () => void;
    loading?: boolean;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

const PaymentModal: React.FC<PaymentModalProps> = ({
    show,
    onHide,
    ticketName,
    ticketPrice,
    quantity,
    eventName,
    onPaymentComplete,
    loading = false,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');

    const convenienceFee = 1.00;
    const subtotal = ticketPrice * quantity;
    const total = subtotal + convenienceFee;

    const paymentMethods = [
        { id: 'upi' as PaymentMethod, name: 'UPI', icon: '📱', description: 'Pay using any UPI app' },
        { id: 'card' as PaymentMethod, name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, Rupay' },
        { id: 'netbanking' as PaymentMethod, name: 'Net Banking', icon: '🏦', description: 'All major banks' },
        { id: 'wallet' as PaymentMethod, name: 'Wallets', icon: '👛', description: 'Paytm, PhonePe, etc.' },
    ];

    const banks = [
        'State Bank of India',
        'HDFC Bank',
        'ICICI Bank',
        'Axis Bank',
        'Punjab National Bank',
        'Kotak Mahindra Bank',
    ];

    const wallets = [
        { name: 'Paytm', icon: '💙' },
        { name: 'PhonePe', icon: '💜' },
        { name: 'Amazon Pay', icon: '🧡' },
        { name: 'Google Pay', icon: '💚' },
    ];

    const canProceed = () => {
        if (!selectedMethod) return false;
        switch (selectedMethod) {
            case 'upi': return upiId.includes('@');
            case 'card': return cardNumber.length >= 16;
            case 'netbanking': return selectedBank !== '';
            case 'wallet': return selectedWallet !== '';
            default: return false;
        }
    };

    const handleProceed = () => {
        if (canProceed()) {
            onPaymentComplete();
        }
    };

    const resetForm = () => {
        setSelectedMethod(null);
        setUpiId('');
        setCardNumber('');
        setSelectedBank('');
        setSelectedWallet('');
    };

    return (
        <Modal
            show={show}
            onHide={() => { resetForm(); onHide(); }}
            size="lg"
            centered
            backdrop="static"
        >
            <Modal.Header className="payment-header">
                <div className="payment-brand">
                    <span className="razorpay-logo">⚡</span>
                    <span className="brand-text">Razorpay</span>
                </div>
                <Button variant="link" onClick={onHide} className="close-btn">✕</Button>
            </Modal.Header>

            <Modal.Body className="payment-body">
                <Row>
                    {/* Left side - Order Summary */}
                    <Col md={5} className="order-summary">
                        <h6 className="summary-title">Order Summary</h6>
                        <Card className="event-card mb-3">
                            <Card.Body>
                                <h5 className="event-name">{eventName}</h5>
                                <div className="ticket-details">
                                    <span className="ticket-name">{ticketName}</span>
                                    <Badge bg="primary" className="ms-2">×{quantity}</Badge>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>Ticket Price</span>
                                <span>{formatPrice(ticketPrice)} × {quantity}</span>
                            </div>
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="price-row fee">
                                <span>Convenience Fee</span>
                                <span>{formatPrice(convenienceFee)}</span>
                            </div>
                            <hr />
                            <div className="price-row total">
                                <span>Total Amount</span>
                                <span className="total-amount">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </Col>

                    {/* Right side - Payment Options */}
                    <Col md={7} className="payment-options">
                        <h6 className="options-title">Choose Payment Method</h6>

                        <div className="method-list">
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className={`method-item ${selectedMethod === method.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod(method.id)}
                                >
                                    <span className="method-icon">{method.icon}</span>
                                    <div className="method-info">
                                        <div className="method-name">{method.name}</div>
                                        <div className="method-desc">{method.description}</div>
                                    </div>
                                    <div className="method-radio">
                                        {selectedMethod === method.id ? '◉' : '○'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Details Form */}
                        {selectedMethod && (
                            <div className="payment-details mt-3">
                                {selectedMethod === 'upi' && (
                                    <Form.Group>
                                        <Form.Label>Enter UPI ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="yourname@upi"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                        />
                                        <Form.Text className="text-muted">
                                            Example: name@paytm, name@ybl, name@okaxis
                                        </Form.Text>
                                    </Form.Group>
                                )}

                                {selectedMethod === 'card' && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Card Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                            />
                                        </Form.Group>
                                        <Row>
                                            <Col>
                                                <Form.Group>
                                                    <Form.Label>Expiry</Form.Label>
                                                    <Form.Control type="text" placeholder="MM/YY" />
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group>
                                                    <Form.Label>CVV</Form.Label>
                                                    <Form.Control type="password" placeholder="***" maxLength={3} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </>
                                )}

                                {selectedMethod === 'netbanking' && (
                                    <Form.Group>
                                        <Form.Label>Select Bank</Form.Label>
                                        <div className="bank-list">
                                            {banks.map((bank) => (
                                                <div
                                                    key={bank}
                                                    className={`bank-item ${selectedBank === bank ? 'selected' : ''}`}
                                                    onClick={() => setSelectedBank(bank)}
                                                >
                                                    🏦 {bank}
                                                </div>
                                            ))}
                                        </div>
                                    </Form.Group>
                                )}

                                {selectedMethod === 'wallet' && (
                                    <Form.Group>
                                        <Form.Label>Select Wallet</Form.Label>
                                        <div className="wallet-list">
                                            {wallets.map((wallet) => (
                                                <div
                                                    key={wallet.name}
                                                    className={`wallet-item ${selectedWallet === wallet.name ? 'selected' : ''}`}
                                                    onClick={() => setSelectedWallet(wallet.name)}
                                                >
                                                    {wallet.icon} {wallet.name}
                                                </div>
                                            ))}
                                        </div>
                                    </Form.Group>
                                )}
                            </div>
                        )}
                    </Col>
                </Row>
            </Modal.Body>

            <Modal.Footer className="payment-footer">
                <div className="secure-badge">
                    🔒 Secured by Razorpay
                </div>
                <Button
                    variant="success"
                    size="lg"
                    onClick={handleProceed}
                    disabled={!canProceed() || loading}
                    className="pay-button"
                >
                    {loading ? 'Processing...' : `Pay ${formatPrice(total)}`}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PaymentModal;
