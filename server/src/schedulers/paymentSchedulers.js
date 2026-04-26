const cron = require('node-cron');
const PaymentMetadata = require('../models/PaymentMetadata');
const razorpay = require('../utils/razorpay');
const { populatePaymentDetails } = require('../utils/paymentHelpers');
const paymentEmitter = require('../utils/paymentEmitter');

// Cleanup job: Runs every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    console.log('Running Payment Cleanup Job...');
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    try {
        const result = await PaymentMetadata.updateMany(
            { 
                status: 'INITIATED', 
                createdAt: { $lt: thirtyMinsAgo } 
            },
            { status: 'CANCELLED' }
        );
        console.log(`Cleanup complete. Cancelled ${result.modifiedCount} initiated payments.`);
    } catch (error) {
        console.error('Cleanup Job Error:', error);
    }
});

// Reconciliation job: Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    console.log('Running Payment Reconciliation Job...');
    
    try {
        const pendingPayments = await PaymentMetadata.find({ status: 'PENDING' });
        
        for (const metadata of pendingPayments) {
            try {
                const order = await razorpay.orders.fetch(metadata.orderId);
                if (order.status === 'paid') {
                    const payments = await razorpay.orders.fetchPayments(metadata.orderId);
                    if (payments.items && payments.items.length > 0) {
                        const payment = payments.items[0];
                        if (payment.status === 'captured') {
                            metadata.status = 'SUCCESS';
                            metadata.paymentId = payment.id;
                            populatePaymentDetails(metadata, payment);
                            await metadata.save();
                            paymentEmitter.emit('paymentSuccess', metadata);
                            console.log(`Reconciled order ${metadata.orderId} to SUCCESS`);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error reconciling order ${metadata.orderId}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Reconciliation Job Error:', error);
    }
});
