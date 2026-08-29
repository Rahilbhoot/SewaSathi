const mongoose = require('mongoose');
require('dotenv').config();
const Worker = require('./models/Worker');
const Booking = require('./models/Booking');
const Customer = require('./models/Customer');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await Worker.deleteMany({});
        await Customer.deleteMany({});
        await Booking.deleteMany({});

        const workers = await Worker.insertMany([
            {
                name: "Ramesh Sharma",
                phone: "9876543210",
                skills: ["electrician", "appliance_repair"],
                isVerified: true,
                location: { type: "Point", coordinates: [73.8567, 18.5204] },
                weeklyBookings: 2,
                rating: 4.8
            },
            {
                name: "Suresh Patil",
                phone: "9876543211",
                skills: ["plumber", "cleaner"],
                isVerified: true,
                location: { type: "Point", coordinates: [73.8520, 18.5250] },
                weeklyBookings: 5,
                rating: 4.6
            },
            {
                name: "Anil Kumar",
                phone: "9876543212",
                skills: ["electrician"],
                isVerified: true,
                location: { type: "Point", coordinates: [73.8600, 18.5180] },
                weeklyBookings: 1,
                rating: 4.9
            }
        ]);

        const customer = await Customer.create({
            name: "Priya Singh",
            phone: "9123456789",
            address: "Flat 402, Sunshine Heights, Ward 12",
            location: { type: "Point", coordinates: [73.8550, 18.5210] }
        });

        await Booking.create({
            customer: customer._id,
            worker: workers[0]._id,
            serviceRequired: "electrician",
            status: "assigned",
            assignedByAI: false
        });

        console.log("Database seeded Successfully")
        process.exit();
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedData();