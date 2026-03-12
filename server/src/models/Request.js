const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        city: { type: String, required: true },
        town: { type: String, required: true },
        address: { type: String, required: true },
        dateTime: { type: Date, required: true },
        brideName: { type: String, required: true },
        groomName: { type: String, required: true }
    },
    paymentType: {
        type: String,
        enum: ['online', 'offline', 'both'],
        required: true
    },
    acceptedTerms: {
        type: Boolean,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'submitted_offline', 'paid'],
        default: 'unpaid'
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    payments: [{
        method: { type: String, enum: ['online', 'offline'] },
        transactionId: String,
        name: String,
        district: String,
        amount: Number,
        paidAt: { type: Date, default: Date.now }
    }],
    rejectionRemarks: {
        type: String
    },
    deletionReason: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
