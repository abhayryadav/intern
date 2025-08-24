require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Lead = require('./models/Lead');
const { faker } = require('@faker-js/faker'); // Correct import

const seedDatabase = async () => {
  try {
    await connectDB();
    await User.deleteMany({});
    await Lead.deleteMany({});

    // Create test user
    const user = await User.create({
      email: 'test@erino.io',
      password: 'test1234',
    });

    // Create 150 leads
    const leads = Array.from({ length: 150 }, () => ({
      first_name: faker.person.firstName(), // Updated from faker.name.firstName()
      last_name: faker.person.lastName(), // Updated from faker.name.lastName()
      email: faker.internet.email(),
      phone: faker.phone.number(), // Updated from faker.phone.phoneNumber()
      company: faker.company.name(), // Updated from faker.company.companyName()
      city: faker.location.city(), // Updated from faker.address.city()
      state: faker.location.state(), // Updated from faker.address.state()
      source: faker.helpers.arrayElement(['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other']), // Updated from faker.random.arrayElement()
      status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'lost', 'won']), // Updated from faker.random.arrayElement()
      score: faker.number.int({ min: 0, max: 100 }), // Updated from faker.random.number()
      lead_value: faker.number.int({ min: 1000, max: 100000 }), // Updated from faker.random.number()
      last_activity_at: faker.date.recent(),
      is_qualified: faker.datatype.boolean(), // Updated from faker.random.boolean()
      user: user._id,
    }));

    await Lead.insertMany(leads);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();