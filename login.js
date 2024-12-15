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

//get email and password
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
  

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
