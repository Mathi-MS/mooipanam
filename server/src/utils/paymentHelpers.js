const populatePaymentDetails = (metadata, paymentData) => {
    metadata.method = paymentData.method;
    metadata.paymentEmail = paymentData.email;
    metadata.contact = paymentData.contact;
    
    // fee and tax come in paise from Razorpay, converting to rupees
    if (paymentData.fee) metadata.razorpayFee = paymentData.fee / 100;
    if (paymentData.tax) metadata.razorpayTax = paymentData.tax / 100;
    
    metadata.captured = paymentData.captured;
    metadata.international = paymentData.international;
    metadata.rawPaymentResponse = JSON.stringify(paymentData);

    const method = paymentData.method;
    if (method === 'upi') {
        if (paymentData.upi) {
            metadata.vpa = paymentData.upi.vpa;
            metadata.upiFlow = paymentData.upi.flow;
        }
        if (paymentData.acquirer_data) {
            metadata.upiRrn = paymentData.acquirer_data.rrn;
        }
    } else if (method === 'netbanking') {
        // bank field in root
    } else if (method === 'card') {
        if (paymentData.acquirer_data) {
            metadata.cardArn = paymentData.acquirer_data.arn || paymentData.acquirer_data.auth_code;
        }
    }

    return metadata;
};

module.exports = { populatePaymentDetails };
