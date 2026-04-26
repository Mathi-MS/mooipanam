const EventEmitter = require('events');

class PaymentEmitter extends EventEmitter {}

const paymentEmitter = new PaymentEmitter();

module.exports = paymentEmitter;
