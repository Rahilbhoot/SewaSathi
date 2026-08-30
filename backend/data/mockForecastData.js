/**
 * Isolated Mock Historical Booking Dataset for AI Demand Forecasting
 * NOTICE: This file contains sample historical dataset used strictly for
 * demand forecasting analysis without mutating the real database.
 */

const mockHistoricalBookings = [
    { date: "2026-08-20", ward: "Ward 12", skill: "plumbing", bookings: 8 },
    { date: "2026-08-21", ward: "Ward 12", skill: "plumbing", bookings: 12 },
    { date: "2026-08-22", ward: "Ward 12", skill: "plumbing", bookings: 18 },
    { date: "2026-08-23", ward: "Ward 12", skill: "plumbing", bookings: 25 },
    { date: "2026-08-24", ward: "Ward 12", skill: "plumbing", bookings: 30 },
    { date: "2026-08-20", ward: "Kothrud", skill: "electrician", bookings: 5 },
    { date: "2026-08-21", ward: "Kothrud", skill: "electrician", bookings: 7 },
    { date: "2026-08-22", ward: "Kothrud", skill: "electrician", bookings: 15 },
    { date: "2026-08-23", ward: "Kothrud", skill: "electrician", bookings: 19 },
    { date: "2026-08-20", ward: "Ward 5", skill: "appliance_repair", bookings: 4 },
    { date: "2026-08-21", ward: "Ward 5", skill: "appliance_repair", bookings: 6 },
    { date: "2026-08-22", ward: "Ward 5", skill: "appliance_repair", bookings: 9 },
    { date: "2026-08-23", ward: "Ward 5", skill: "cleaner", bookings: 11 }
];

module.exports = mockHistoricalBookings;
