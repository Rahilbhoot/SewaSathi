const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        let booking;
        try {
            booking = await Booking.findById(bookingId)
                .populate('customer', '-password')
                .populate('worker', '-password');
        } catch (err) {
            return res.status(400).json({ error: 'Invalid booking ID format' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ error: 'Invoice is only available for completed bookings' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${booking._id}.pdf"`);

        doc.pipe(res);

        // Header
        doc.fillColor('#2563EB').fontSize(24).text('SewaSathi', 50, 45, { bold: true });
        doc.fillColor('#4B5563').fontSize(10).text('On-Demand Local Services & Worker Welfare Platform', 50, 75);
        doc.fillColor('#111827').fontSize(18).text('TAX INVOICE', 400, 45, { align: 'right' });

        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 95).lineTo(550, 95).stroke();

        // Invoice Metadata
        doc.fontSize(10).fillColor('#374151')
            .text(`Invoice No: INV-${booking._id.toString().toUpperCase()}`, 50, 110)
            .text(`Booking ID: ${booking._id}`, 50, 125)
            .text(`Booking Date: ${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}`, 50, 140)
            .text(`Completion Date: ${booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 50, 155);

        doc.text(`Payment Status: PAID`, 350, 110, { align: 'right' })
            .text(`Order ID: ${booking.orderId || booking.paymentId || 'PAY-' + booking._id.toString().slice(-6)}`, 250, 125, { align: 'right' });

        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 175).lineTo(550, 175).stroke();

        // Customer & Worker Details
        doc.fontSize(12).fillColor('#111827').text('Customer Details', 50, 190).text('Service Worker Details', 320, 190);

        const customerName = booking.customer ? booking.customer.name : 'N/A';
        const customerPhone = booking.customer ? booking.customer.phone : 'N/A';
        const customerAddr = booking.customer ? booking.customer.address || 'N/A' : 'N/A';
        const workerName = booking.worker ? booking.worker.name : 'Assigned Worker';
        const workerPhone = booking.worker ? booking.worker.phone : 'N/A';

        doc.fontSize(10).fillColor('#4B5563')
            .text(`Name: ${customerName}`, 50, 210)
            .text(`Phone: ${customerPhone}`, 50, 225)
            .text(`Address: ${customerAddr}`, 50, 240, { width: 230 });

        doc.text(`Name: ${workerName}`, 320, 210)
            .text(`Contact: ${workerPhone}`, 320, 225)
            .text(`Status: Completed`, 320, 240);

        // Table
        const tableTop = 290;
        doc.rect(50, tableTop, 500, 25).fill('#F3F4F6');
        doc.fillColor('#111827').fontSize(10)
            .text('Service Description', 60, tableTop + 7)
            .text('Qty', 350, tableTop + 7)
            .text('Amount (INR)', 450, tableTop + 7, { align: 'right' });

        const rowTop = tableTop + 35;
        const amount = booking.amount || 500;
        doc.fillColor('#374151')
            .text((booking.serviceRequired || 'General Service').toUpperCase(), 60, rowTop)
            .text('1', 350, rowTop)
            .text(`Rs. ${amount.toFixed(2)}`, 450, rowTop, { align: 'right' });

        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, rowTop + 25).lineTo(550, rowTop + 25).stroke();

        // Total
        const totalTop = rowTop + 40;
        doc.fontSize(12).fillColor('#111827')
            .text('Total Amount Paid:', 300, totalTop)
            .text(`Rs. ${amount.toFixed(2)}`, 450, totalTop, { align: 'right' });

        doc.fontSize(9).fillColor('#9CA3AF')
            .text('Thank you for choosing SewaSathi. Computer-generated tax invoice.', 50, 680, { align: 'center', width: 500 });

        doc.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'completed' })
            .populate('customer', '-password')
            .populate('worker', '-password');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
