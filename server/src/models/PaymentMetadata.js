const mongoose = require('mongoose');

const paymentMetadataSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    signature: { type: String },
    upiRrn: { type: String },
    status: {
        type: String,
        enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'ERROR'],
        default: 'INITIATED'
    },
    discountType: { type: String, default: 'NONE' },
    discountValue: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // in paise
    price: { type: Number, required: true },  // in rupees
    currency: { type: String, default: 'INR' },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true
    },
    userId: { type: String, required: true }, // Keeping as String to match LMS sample (Keycloak UUID)
    userName: { type: String },
    email: { type: String },
    mobile: { type: String },
    method: { type: String },
    vpa: { type: String },
    upiFlow: { type: String },
    paymentEmail: { type: String },
    contact: { type: String },
    razorpayTax: { type: Number, default: 0 },
    razorpayFee: { type: Number, default: 0 },
    captured: { type: Boolean, default: false },
    international: { type: Boolean, default: false },
    rawOrderResponse: { type: String },
    rawPaymentResponse: { type: String },
    rawWebhookPayload: { type: String },
    error: {
        code: String,
        description: String
    },
    exception: {
        type: String,
        message: String
    }
}, {
    timestamps: true
});

const PaymentMetadata = mongoose.model('PaymentMetadata', paymentMetadataSchema);
module.exports = PaymentMetadata;
