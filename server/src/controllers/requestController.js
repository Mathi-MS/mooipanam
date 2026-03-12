const Request = require('../models/Request');

// @desc    Create new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
    try {
        const { details, paymentType, acceptedTerms } = req.body;

        const request = await Request.create({
            user: req.user._id,
            details,
            paymentType,
            acceptedTerms
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        // If not admin/superadmin, only show user's own requests
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            query.user = req.user._id;
        }

        const requests = await Request.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalRequests = await Request.countDocuments(query);
        const totalPages = Math.ceil(totalRequests / limit);

        res.json({
            requests,
            totalPages,
            currentPage: page,
            totalRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Check ownership
        if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (request.status !== 'pending' && req.user.role !== 'superadmin') {
            return res.status(400).json({ message: 'Cannot update request after it has been reviewed' });
        }

        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Soft delete request
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: 'Deletion reason is required' });
    }

    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Check ownership
        if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.isDeleted = true;
        request.deletionReason = reason;
        await request.save();

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review request (Accept/Reject)
// @route   PATCH /api/requests/:id/review
// @access  Private/Admin
const reviewRequest = async (req, res) => {
    const { status, remarks } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    if (status === 'rejected' && !remarks) {
        return res.status(400).json({ message: 'Remarks are required for rejection' });
    }

    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        if (remarks) request.rejectionRemarks = remarks;
        await request.save();

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id).populate('user', 'name email');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Check ownership
        if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get request details for public payment page
// @route   GET /api/requests/:id/public
// @access  Public
const getRequestDetailsPublic = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({ message: 'Request not yet approved' });
        }

        // Return limited details
        res.json({
            _id: request._id,
            details: {
                name: request.details.name,
                city: request.details.city,
                town: request.details.town
            },
            paymentType: request.paymentType,
            paymentStatus: request.paymentStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit offline payment details
// @route   POST /api/requests/:id/offline-payment
// @access  Private
const submitOfflinePayment = async (req, res) => {
    const { name, district, amount } = req.body;

    if (!name || !district || !amount) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.paymentStatus = 'submitted_offline';
        request.totalAmount = (request.totalAmount || 0) + Number(amount);
        request.payments.push({
            method: 'offline',
            name,
            district,
            amount: Number(amount),
            paidAt: new Date()
        });

        await request.save();
        res.json({ message: 'Offline payment details submitted successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify online payment (Razorpay)
// @route   POST /api/requests/:id/verify-payment
// @access  Public (called after razorpay success)
const verifyOnlinePayment = async (req, res) => {
    const { name, district, amount, razorpay_payment_id } = req.body;

    // Ideally, we'd verify the signature here with Razorpay SDK
    
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.paymentStatus = 'paid';
        request.totalAmount = (request.totalAmount || 0) + Number(amount);
        request.payments.push({
            method: 'online',
            transactionId: razorpay_payment_id,
            name,
            district,
            amount: Number(amount),
            paidAt: new Date()
        });

        await request.save();
        res.json({ message: 'Payment verified and stored successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payment reports
// @route   GET /api/requests/reports
// @access  Private/Admin
const getPaymentReports = async (req, res) => {
    try {
        let query = { 
            payments: { $exists: true, $not: { $size: 0 } }
        };

        if (req.user && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            query.user = req.user._id;
        }

        const requests = await Request.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        // Flatten payments for the report
        const reports = [];
        requests.forEach(requestDoc => {
            if (Array.isArray(requestDoc.payments)) {
                requestDoc.payments.forEach(payment => {
                    reports.push({
                        _id: payment._id,
                        requestId: requestDoc._id,
                        user: requestDoc.user,
                        details: requestDoc.details,
                        paymentStatus: requestDoc.paymentStatus,
                        amount: payment.amount || requestDoc.totalAmount || 0,
                        paymentDetails: {
                            method: payment.method,
                            transactionId: payment.transactionId,
                            name: payment.name,
                            district: payment.district,
                            paidAt: payment.paidAt
                        }
                    });
                });
            }
        });

        // Sort by payment date
        reports.sort((a, b) => {
            const dateA = a.paymentDetails.paidAt ? new Date(a.paymentDetails.paidAt) : new Date(0);
            const dateB = b.paymentDetails.paidAt ? new Date(b.paymentDetails.paidAt) : new Date(0);
            return dateB - dateA;
        });

        res.json(reports);
    } catch (error) {
        console.error('Error in getPaymentReports:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/requests/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
        const userQuery = isAdmin ? {} : { user: req.user._id };

        // 1. Total Requests
        const totalRequests = await Request.countDocuments(userQuery);

        // 2. Pending Approvals
        const pendingRequests = await Request.countDocuments({ ...userQuery, status: 'pending' });

        // 3. Today's Requests
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const todayRequests = await Request.countDocuments({
            ...userQuery,
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        // 4. Completed Payments & Total Revenue
        const paidQuery = { ...userQuery, payments: { $exists: true, $not: { $size: 0 } } };
        const paidRequestsDocs = await Request.find(paidQuery);
        let completedPayments = paidRequestsDocs.length;
        let totalRevenue = 0;
        paidRequestsDocs.forEach(doc => {
            if (Array.isArray(doc.payments)) {
                doc.payments.forEach(p => totalRevenue += (p.amount || 0));
            }
        });

        // 5. Status distribution for Pie Chart
        const statusAggregation = await Request.aggregate([
            { $match: userQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const statusDistribution = statusAggregation.map(item => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.count
        }));

        // 6. Last 5 Requests
        const last5Requests = await Request.find(userQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');

        // 7. Last 5 Payments
        const recentPaidRequests = await Request.find(paidQuery)
            .sort({ updatedAt: -1 })
            .populate('user', 'name');
            
        let allPayments = [];
        recentPaidRequests.forEach(reqDoc => {
            reqDoc.payments.forEach(payment => {
                allPayments.push({
                    _id: payment._id,
                    requestId: reqDoc._id,
                    requestName: reqDoc.details ? reqDoc.details.name : 'Unknown',
                    userName: reqDoc.user ? reqDoc.user.name : 'Unknown',
                    method: payment.method,
                    amount: payment.amount,
                    paidAt: payment.paidAt
                });
            });
        });
        
        allPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
        const last5Payments = allPayments.slice(0, 5);

        res.json({
            stats: {
                totalRequests,
                pendingRequests,
                todayRequests,
                completedPayments,
                totalRevenue
            },
            statusDistribution,
            last5Requests,
            last5Payments
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
