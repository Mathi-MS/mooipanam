const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
    reviewRequest,
    getRequestDetailsPublic,
    submitOfflinePayment,
    verifyOnlinePayment,
    getPaymentReports,
    getDashboardStats
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/reports', protect, getPaymentReports);

router.route('/')
    .post(protect, createRequest)
    .get(protect, getRequests);

router.get('/reports', protect, getPaymentReports);

router.route('/:id')
    .get(protect, getRequestById)
    .put(protect, updateRequest)
    .delete(protect, deleteRequest);

router.patch('/:id/review', protect, authorize('admin', 'superadmin'), reviewRequest);

// Payment Routes
router.get('/:id/public', getRequestDetailsPublic);
router.post('/:id/offline-payment', protect, submitOfflinePayment);
router.post('/:id/verify-payment', verifyOnlinePayment);

module.exports = router;
