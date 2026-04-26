const paymentEmitter = require('../utils/paymentEmitter');
const Request = require('../models/Request');

paymentEmitter.on('paymentSuccess', async (metadata) => {
    console.log(`Payment Success Event Listener: Processing metadata ${metadata._id} for request ${metadata.requestId}`);
    
    try {
        const request = await Request.findById(metadata.requestId);
        if (!request) {
            console.error(`Request ${metadata.requestId} not found during payment success listener`);
            return;
        }

        // Idempotency check: avoid duplicate entries in payments array
        const alreadyPaid = request.payments.some(p => p.transactionId === metadata.paymentId);
        if (alreadyPaid) {
            console.log(`Payment ${metadata.paymentId} already processed for request ${request._id}`);
            return;
        }

        request.paymentStatus = 'paid';
        request.totalAmount = (request.totalAmount || 0) + (metadata.price);
        
        request.payments.push({
            method: 'online',
            transactionId: metadata.paymentId,
            orderId: metadata.orderId,
            name: metadata.userName,
            amount: metadata.price,
            paidAt: new Date()
        });

        await request.save();
        console.log(`Request ${request._id} updated to 'paid' state.`);
    } catch (error) {
        console.error('Error in paymentSuccess listener:', error);
    }
});
