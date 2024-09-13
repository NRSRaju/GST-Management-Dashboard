
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect('mongodb+srv://NRSRaju:Raju9398@cluster0.0n9qgog.mongodb.net/gst-management?retryWrites=true&w=majority&appName=Cluster0', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('Successfully connected to MongoDB'))
// .catch((error) => console.error('Error connecting to MongoDB:', error));

// // Models
// const InvoiceSchema = new mongoose.Schema({
//   recruiterID: { type: String, required: true },
//   amount: { type: Number, required: true },
//   gstAmount: { type: Number, required: true },
//   status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
//   createdAt: { type: Date, default: Date.now },
// });

// const Invoice = mongoose.model('Invoice', InvoiceSchema);

// const PaymentSchema = new mongoose.Schema({
//   invoiceID: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
//   amount: { type: Number, required: true },
//   status: { type: String, enum: ['success', 'failed'], required: true },
//   transactionDate: { type: Date, default: Date.now },
// });

// const Payment = mongoose.model('Payment', PaymentSchema);

// // Services
// const GST_RATE = 0.18; // 18% GST
// const gstCalculator = {
//   calculateGST: (amount) => amount * GST_RATE,
// };

// const reportGenerator = {
//   generateReport: (invoices) => {
//     const totalGSTCollected = invoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
//     const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
//     const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length;

//     return {
//       totalGSTCollected,
//       totalInvoices: invoices.length,
//       pendingInvoices,
//       paidInvoices,
//     };
//   },
// };

// // Utility functions to fetch data from database
// const fetchDataFromDatabase = async () => {
//   const totalGSTCollected = await Invoice.aggregate([
//     { $group: { _id: null, total: { $sum: "$gstAmount" } } }
//   ]);
//   const pendingPayments = await Invoice.countDocuments({ status: 'pending' });
//   const totalInvoices = await Invoice.countDocuments();
//   const monthlyGSTAverage = await Invoice.aggregate([
//     {
//       $group: {
//         _id: { $month: "$createdAt" },
//         average: { $avg: "$gstAmount" }
//       }
//     },
//     { $group: { _id: null, average: { $avg: "$average" } } }
//   ]);

//   return {
//     totalGSTCollected: totalGSTCollected[0]?.total || 0,
//     pendingPayments,
//     totalInvoices,
//     monthlyGSTAverage: monthlyGSTAverage[0]?.average || 0
//   };
// };

// const fetchPaymentsFromDatabase = async (filter) => {
//   const query = filter !== 'all' ? { status: filter } : {};
//   const payments = await Payment.find(query).populate('invoiceID');
//   return payments;
// };

// // Routes
// app.post('/api/invoices', async (req, res) => {
//   try {
//     const { recruiterID, amount } = req.body;
//     const gstAmount = gstCalculator.calculateGST(amount);
//     const newInvoice = new Invoice({ recruiterID, amount, gstAmount });
//     await newInvoice.save();
//     res.status(201).json(newInvoice);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// app.get('/api/invoices', async (req, res) => {
//   try {
//     const invoices = await Invoice.find();
//     res.json(invoices);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// app.post('/api/payments', async (req, res) => {
//   try {
//     const { invoiceID, amount } = req.body;
//     const invoice = await Invoice.findById(invoiceID);
//     if (!invoice) {
//       return res.status(404).json({ message: 'Invoice not found' });
//     }

//     const payment = new Payment({ invoiceID, amount, status: 'success' });
//     await payment.save();

//     invoice.status = 'paid';
//     await invoice.save();

//     res.status(201).json(payment);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// app.get('/api/reports', async (req, res) => {
//   try {
//     const { start, end } = req.query;
//     const query = {};
//     if (start && end) {
//       query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
//     }
//     const invoices = await Invoice.find(query);
//     const report = reportGenerator.generateReport(invoices);
//     res.json(report);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// app.get('/api/dashboard', async (req, res) => {
//   try {
//     const data = await fetchDataFromDatabase();
//     res.status(200).json(data);
//   } catch (error) {
//     console.error('Error fetching dashboard data:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// app.get('/api/payments', async (req, res) => {
//   try {
//     const filter = req.query.filter;
//     const payments = await fetchPaymentsFromDatabase(filter);
//     res.status(200).json(payments);
//   } catch (error) {
//     console.error('Error fetching payments:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://NRSRaju:Raju9398@cluster0.0n9qgog.mongodb.net/gst-management?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Successfully connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Models
const InvoiceSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['recruiter', 'admin'],
    default: 'recruiter',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);

const PaymentSchema = new mongoose.Schema({
  // invoiceID: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoiceID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  transactionDate: { type: Date, default: Date.now },
});

const Payment = mongoose.model('Payment', PaymentSchema);
// Services
const GST_RATE = 0.18; // 18% GST
const gstCalculator = {
  calculateGST: (amount) => amount * GST_RATE,
};

const reportGenerator = {
  generateReport: (invoices) => {
    const totalGSTCollected = invoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length;

    return {
      totalGSTCollected,
      totalInvoices: invoices.length,
      pendingInvoices,
      paidInvoices,
    };
  },
};

// Email Service
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReminderEmail = async (to, invoice) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'GST Payment Reminder',
    html: `
      <h1>GST Payment Reminder</h1>
      <p>Your GST payment of ${invoice.gstAmount} is due on ${invoice.dueDate.toDateString()}.</p>
      <p>Please ensure timely payment to avoid any penalties.</p>
    `,
  });
};

const sendAdminAlertEmail = async (to, totalGSTDue) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'GST Payment Alert',
    html: `
      <h1>GST Payment Alert</h1>
      <p>The total GST amount due for payment is ${totalGSTDue}.</p>
      <p>Please ensure this amount is paid to the government before the deadline.</p>
    `,
  });
};

// Utility functions
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const isWithinDays = (date, days) => {
  const now = new Date();
  const difference = date.getTime() - now.getTime();
  const daysDifference = difference / (1000 * 3600 * 24);
  return daysDifference <= days && daysDifference >= 0;
};

// Reminder Service
const sendReminders = async () => {
  const pendingInvoices = await Invoice.find({ status: 'pending' }).populate('recruiter');

  for (const invoice of pendingInvoices) {
    if (isWithinDays(invoice.dueDate, 7)) {
      await sendReminderEmail(invoice.recruiter.email, invoice);
    }
  }
};

const sendAdminAlerts = async () => {
  const totalGSTDue = await Invoice.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$gstAmount' } } }
  ]);

  const admins = await User.find({ role: 'admin' });

  for (const admin of admins) {
    await sendAdminAlertEmail(admin.email, totalGSTDue[0].total);
  }
};

// Start reminder cron jobs
cron.schedule('0 0 * * *', sendReminders);
cron.schedule('0 0 1 * *', sendAdminAlerts);

// // Routes
// app.post('/api/invoices', async (req, res) => {
//   try {
//     const { recruiter, amount, dueDate } = req.body;
//     const gstAmount = gstCalculator.calculateGST(amount);
//     const newInvoice = new Invoice({ recruiter, amount, gstAmount, dueDate });
//     await newInvoice.save();
//     res.status(201).json(newInvoice);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
app.post('/api/invoices', async (req, res) => {
  try {
    const { recruiterID, amount } = req.body;
    const gstAmount = gstCalculator.calculateGST(amount);
    const newInvoice = new Invoice({ recruiterID, amount, gstAmount });
    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/invoices', async (req, res) => {
  try {
    const { status, recruiterId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (recruiterId) query.recruiter = recruiterId;

    const invoices = await Invoice.find(query).populate('recruiter');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (invoice == null) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (req.body.status != null) {
      invoice.status = req.body.status;
    }

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { invoiceID, amount } = req.body;
    const invoice = await Invoice.findById(invoiceID);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const payment = new Payment({ invoiceID, amount, status: 'success' });
    await payment.save();

    invoice.status = 'paid';
    await invoice.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = {};
    if (start && end) {
      query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }
    const invoices = await Invoice.find(query);
    const report = reportGenerator.generateReport(invoices);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const totalGSTCollected = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$gstAmount" } } }
    ]);
    const pendingPayments = await Invoice.countDocuments({ status: 'pending' });
    const totalInvoices = await Invoice.countDocuments();
    const monthlyGSTAverage = await Invoice.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          average: { $avg: "$gstAmount" }
        }
      },
      { $group: { _id: null, average: { $avg: "$average" } } }
    ]);

    res.status(200).json({
      totalGSTCollected: totalGSTCollected[0]?.total || 0,
      pendingPayments,
      totalInvoices,
      monthlyGSTAverage: monthlyGSTAverage[0]?.average || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const filter = req.query.filter;
    const query = filter !== 'all' ? { status: filter } : {};
    const payments = await Payment.find(query).populate('invoiceID');
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Data seeding function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Invoice.deleteMany();

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    });

    const recruiters = await User.insertMany([
      { name: 'John Doe', email: 'john@example.com', role: 'recruiter' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'recruiter' },
      { name: 'Bob Johnson', email: 'bob@example.com', role: 'recruiter' },
    ]);

    // Create invoices
    const today = new Date();
    const invoices = await Invoice.insertMany([
      {
        recruiter: recruiters[0]._id,
        amount: 1000,
        gstAmount: 100,
        dueDate: addDays(today, 14),
        status: 'pending',
      },
      {
        recruiter: recruiters[1]._id,
        amount: 1500,
        gstAmount: 150,
        dueDate: addDays(today, 30),
        status: 'pending',
      },
      {
        recruiter: recruiters[2]._id,
        amount: 2000,
        gstAmount: 200,
        dueDate: addDays(today, 7),
        status: 'paid',
      },
      {
        recruiter: recruiters[0]._id,
        amount: 1200,
        gstAmount: 120,
        dueDate: addDays(today, 45),
        status: 'pending',
      },
      {
        recruiter: recruiters[1]._id,
        amount: 1800,
        gstAmount: 180,
        dueDate: addDays(today, 21),
        status: 'pending',
      },
      {
        recruiter: recruiters[2]._id,
        amount: 2200,
        gstAmount: 220,
        dueDate: addDays(today, 60),
        status: 'pending',
      },
    ]);

    console.log('Dummy data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Seed data on application start
seedData().then(() => {
  console.log('Data seeding completed');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;