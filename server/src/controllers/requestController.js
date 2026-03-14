const Request = require('../models/Request');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const { search } = req.query;
        let query = {};

        // If not admin/superadmin, only show user's own requests
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            query.user = req.user._id;
        }

        // Search filter
        if (search) {
            query.$or = [
                { 'details.name': { $regex: search, $options: 'i' } },
                { 'details.brideName': { $regex: search, $options: 'i' } },
                { 'details.groomName': { $regex: search, $options: 'i' } },
                { 'details.city': { $regex: search, $options: 'i' } },
                { 'details.mobile': { $regex: search, $options: 'i' } }
            ];
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

// @desc    Create Razorpay Order
// @route   POST /api/requests/create-order
// @access  Public
const createOrder = async (req, res) => {
    try {
        const { requestId, amount, payerName, payerDistrict } = req.body;
        console.log('Creating Order for Request:', requestId, 'Amount:', amount);

        if (!requestId || !amount) {
            return res.status(400).json({ message: 'Request ID and amount are required' });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay keys are missing in .env');
            return res.status(500).json({ message: 'Razorpay configuration missing' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `rcpt_${requestId.toString().slice(-10)}_${Date.now().toString().slice(-10)}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay Order Creation Error Full:', JSON.stringify(error, null, 2));
        console.error('Razorpay Order Creation Error Message:', error.message);
        res.status(500).json({ 
            message: 'Failed to create Razorpay order',
            error: error.message || 'Unknown error',
            details: error
        });
    }
};

// @desc    Verify online payment (Razorpay)
// @route   POST /api/requests/:id/verify-payment
// @access  Public (called after razorpay success)
const verifyOnlinePayment = async (req, res) => {
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        requestId, 
        amount, 
        payerName, 
        payerDistrict 
    } = req.body;

    console.log('Verifying Online Payment:', {
        razorpay_order_id,
        razorpay_payment_id,
        requestId,
        amount,
        payerName
    });

    try {
        // Verification Logic
        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error('RAZORPAY_KEY_SECRET missing in .env');
            return res.status(500).json({ message: 'Razorpay configuration missing' });
        }
        
        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            console.error('Signature Mismatch:', { digest, razorpay_signature });
            return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
        }

        const request = await Request.findById(requestId || req.params.id);

        if (!request) {
            console.error('Request not found during verification:', requestId || req.params.id);
            return res.status(404).json({ message: 'Request not found' });
        }

        console.log('Updating Request Payment Status:', request._id);
        request.paymentStatus = 'paid';
        request.totalAmount = (request.totalAmount || 0) + Number(amount);
        request.payments.push({
            method: 'online',
            transactionId: razorpay_payment_id,
            orderId: razorpay_order_id,
            name: payerName,
            district: payerDistrict,
            amount: Number(amount),
            paidAt: new Date()
        });

        const savedRequest = await request.save();
        console.log('Payment saved successfully for request:', savedRequest._id);
        res.json({ message: 'Payment verified and stored successfully', request: savedRequest });
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payment reports
// @route   GET /api/requests/reports
// @access  Private/Admin
const getPaymentReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let matchQuery = { 
            payments: { $exists: true, $not: { $size: 0 } }
        };

        if (req.user && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            matchQuery.user = req.user._id;
        }

        const aggregationPipeline = [
            { $match: matchQuery },
            { $unwind: "$payments" },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }
        ];

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { "details.name": searchRegex },
                        { "payments.name": searchRegex },
                        { "payments.district": searchRegex },
                        { "payments.method": searchRegex }
                    ]
                }
            });
        }

        aggregationPipeline.push(
            { $sort: { "payments.paidAt": -1 } },
            {
                $project: {
                    _id: "$payments._id",
                    requestId: "$_id",
                    user: { name: "$userDetails.name", email: "$userDetails.email" },
                    details: "$details",
                    paymentStatus: "$paymentStatus",
                    amount: { $cond: [{ $ifNull: ["$payments.amount", false] }, "$payments.amount", "$totalAmount"] },
                    paymentDetails: {
                        method: "$payments.method",
                        transactionId: "$payments.transactionId",
                        name: "$payments.name",
                        district: "$payments.district",
                        paidAt: "$payments.paidAt"
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }, { $addFields: { page: page } }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        );

        const result = await Request.aggregate(aggregationPipeline);
        const metadata = result[0].metadata[0] || { total: 0, page: page };
        const reports = result[0].data;
        const totalPages = Math.ceil(metadata.total / limit);

        res.json({
            reports,
            totalPages,
            currentPage: metadata.page,
            totalReports: metadata.total
        });
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
    createOrder,
    verifyOnlinePayment,
    getPaymentReports,
    getDashboardStats
};
