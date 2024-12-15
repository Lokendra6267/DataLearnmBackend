const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'W7301@jqir#',
  database: 'auth_system',
});


db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Database');
});


let otpStore = {}; // Temporary store for OTPs

// Mock payment initiation
app.post("/api/payment/initiate", (req, res) => {
  const { cardNumber, expiryDate, cvv } = req.body;

  if (cardNumber && expiryDate && cvv) {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    otpStore[cardNumber] = otp; // Store OTP temporarily
    console.log(`Generated OTP: ${otp}`); // Log OTP for testing purposes

    // Insert credit card details into the database
    const query = "INSERT INTO creditCardDetails (cardNumber, expiryDate, cvv) VALUES (?, ?, ?)";
    db.query(query, [cardNumber, expiryDate, cvv], (err, result) => {
      if (err) {
        console.error("Error inserting credit card details:", err);
        return res.status(500).json({ success: false, message: "Error storing card details." });
      }

      // Simulate sending OTP to user's mobile number
      res.json({ success: true, message: "OTP sent to registered mobile number." });
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid card details." });
  }
});

// Mock OTP verification
app.post("/api/payment/verify", (req, res) => {
  const { otp } = req.body;

  if (Object.values(otpStore).includes(parseInt(otp, 10))) {
    res.json({ success: true, message: "Transaction successful!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP." });
  }
});


// Create 'users' table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )`,
  (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Users table ready');
    }
  }
);

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to the API! Use /register or /login to interact with the database.');
});

// Registration Endpoint
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Insert user into the database
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Email already registered' });
      } else {
        res.status(500).json({ message: 'Error registering user' });
      }
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
  });
});

// Login Endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Query to check if user exists with given email and password
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (results.length > 0) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

// Fetch All Users Endpoint
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM users';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Error fetching users' });
    } else {
      res.status(200).json(results);
    }
  });
});

// Get User By Email Endpoint
app.get('/users/email/:email', (req, res) => {
  const email = req.params.email;

  // Query to fetch user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (results.length > 0) {
      res.status(200).json(results[0]); // Returning the user object
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});


app.post('/contactdata', (req, res) => {
    const { name, email, message } = req.body;
  
    // Insert the contact form data into the 'contactus' table
    const query = 'INSERT INTO contactus (name, email, message) VALUES (?, ?, ?)';
    db.query(query, [name, email, message], (err, result) => {
      if (err) {
        console.error('Error inserting contact form data:', err);
        res.status(500).json({ message: 'Error submitting message' });
      } else {
        res.status(201).json({ message: 'Message submitted successfully' });
      }
    });
  });

// Contact Us Get Endpoint
app.get('/contactus', (req, res) => {
    // Query to retrieve all contact form submissions
    const query = 'SELECT * FROM contactus ORDER BY submitted_at DESC';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error retrieving contact form data:', err);
        res.status(500).json({ message: 'Error retrieving messages' });
      } else {
        res.status(200).json(results);
      }
    });
  });
  

  app.post('/enroll', (req, res) => {
    const { name, email, phone, courses, paymentMethod } = req.body;
  
    if (!name || !email || !phone || !courses.length || !paymentMethod) {
      return res.status(400).send({ message: 'All fields are required' });
    }
  
    const query = `INSERT INTO enrolled (name, email, phone, course_name, payment_method) VALUES (?, ?, ?, ?, ?)`;
  
    // Multiple Row Insert
    courses.forEach((course) => {
      db.query(query, [name, email, phone, course, paymentMethod], (err) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).send({ message: 'Error inserting enrollment data' });
        }
      });
    });
  
    res.status(201).send({ message: 'Enrollment successful' });
  });
  
  
// Get Enrollments Endpoint
app.get('/enrollments', (req, res) => {
    const query = 'SELECT * FROM enrolled ORDER BY enrolled_at DESC';
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error retrieving enrollments:', err);
        return res.status(500).json({ message: 'Error retrieving enrollments' });
      }
  
      res.status(200).json(results);
    });
  });
  
  // POST: Schedule Interview
app.post('/schedule-interview', (req, res) => {
  const { name, email, role, date, time, message } = req.body;

  if (!name || !email || !role || !date || !time) {
    return res.status(400).json({ message: 'All fields except message are required' });
  }

  const query = 'INSERT INTO scheduleInterview (name, email, role, date, time, message) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, email, role, date, time, message], (err, result) => {
    if (err) {
      console.error('Error scheduling interview:', err);
      return res.status(500).json({ message: 'Error scheduling interview' });
    }
    res.status(201).json({ message: 'Interview scheduled successfully' });
  });
});

// GET: Fetch All Scheduled Interviews
app.get('/schedule-interview', (req, res) => {
  const query = 'SELECT * FROM scheduleInterview ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching scheduled interviews:', err);
      return res.status(500).json({ message: 'Error fetching interviews' });
    }
    res.status(200).json(results);
  });
});


// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
