// server.js - Node.js backend for GoWheels
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // For serving HTML/CSS/JS files

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GoWheels',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ message: 'Database connected!', data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER AUTHENTICATION ENDPOINTS ---

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [rows] = await pool.query(
      'SELECT username, category FROM Users WHERE username = ? AND pwd = ?',
      [username, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is a passenger or driver
    if (rows[0].category === 0) { // Driver
      const [driverInfo] = await pool.query(
        'SELECT * FROM Drivers WHERE Driver_ID = ?',
        [rows[0].username]
      );
      
      if (driverInfo.length > 0) {
        return res.json({ 
          user: rows[0],
          userType: 'driver',
          driverInfo: driverInfo[0]
        });
      }
    } else { // Passenger
      const [passengerInfo] = await pool.query(
        'SELECT * FROM Passenger WHERE Passenger_ID = ?',
        [rows[0].username]
      );
      
      if (passengerInfo.length > 0) {
        return res.json({ 
          user: rows[0],
          userType: 'passenger',
          passengerInfo: passengerInfo[0]
        });
      }
    }
    
    res.json({ user: rows[0] });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PASSENGER ENDPOINTS ---

// Get all passengers
app.get('/api/passengers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Passenger');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get passenger by ID
app.get('/api/passengers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Passenger WHERE Passenger_ID = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update passenger information
app.put('/api/passengers/:id', async (req, res) => {
  try {
    const { name, contact_number, pickup_location } = req.body;
    
    const [result] = await pool.query(
      'UPDATE Passenger SET Name = ?, Contact_Number = ?, Pickup_Location = ? WHERE Passenger_ID = ?',
      [name, contact_number, pickup_location, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    
    res.json({ message: 'Passenger updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DRIVER ENDPOINTS ---

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, v.Car_Model, v.Car_Type 
      FROM Drivers d 
      JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available drivers
app.get('/api/drivers/available', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, v.Car_Model, v.Car_Type 
      FROM Drivers d 
      JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
      WHERE d.Current_Status = 'Available'
      ORDER BY d.Rating DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver by ID
app.get('/api/drivers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, v.Car_Model, v.Car_Type 
      FROM Drivers d 
      JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
      WHERE d.Driver_ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver status
app.put('/api/drivers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Off Duty', 'Available', 'In Ride'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [result] = await pool.query(
      'UPDATE Drivers SET Current_Status = ? WHERE Driver_ID = ?',
      [status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json({ message: 'Driver status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver location
app.put('/api/drivers/:id/location', async (req, res) => {
  try {
    const { cab_location } = req.body;
    
    const [result] = await pool.query(
      'UPDATE Drivers SET Cab_Location = ? WHERE Driver_ID = ?',
      [cab_location, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json({ message: 'Driver location updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BOOKING ENDPOINTS ---

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, p.Name as Passenger_Name 
      FROM Booking b
      JOIN Passenger p ON b.Booking_Passenger_ID = p.Passenger_ID
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bookings by passenger ID
app.get('/api/bookings/passenger/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM Booking WHERE Booking_Passenger_ID = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { passenger_id, pickup_location, drop_location } = req.body;
    
    // Validate locations are different
    if (pickup_location === drop_location) {
      return res.status(400).json({ error: 'Pickup and drop locations cannot be the same' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO Booking (Booking_Passenger_ID, Pickup_Location, Drop_Location) VALUES (?, ?, ?)',
      [passenger_id, pickup_location, drop_location]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Booking created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TRIP ENDPOINTS ---

// Create a new trip from booking
app.post('/api/trips', async (req, res) => {
  try {
    const { booking_id, driver_id } = req.body;
    
    // Get booking details
    const [bookings] = await pool.query(
      'SELECT * FROM Booking WHERE Booking_ID = ?',
      [booking_id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookings[0];
    
    // Create trip
    const [result] = await pool.query(
      `INSERT INTO Trip (Trip_ID, Trip_Status, Trip_Date_Time, Trip_Passenger_ID, 
                         Trip_Driver_ID, Pickup_Location, Drop_Location, Fare) 
       VALUES (?, 'Pending', NOW(), ?, ?, ?, ?, ?)`,
      [booking_id, booking.Booking_Passenger_ID, driver_id, booking.Pickup_Location, booking.Drop_Location, calculateFare()]
    );
    
    // Update driver status
    await pool.query(
      'UPDATE Drivers SET Current_Status = "In Ride" WHERE Driver_ID = ?',
      [driver_id]
    );
    
    res.status(201).json({ 
      message: 'Trip created successfully',
      trip_id: booking_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trip by ID
app.get('/api/trips/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, p.Name as Passenger_Name, d.Driver_Name, v.Car_Model, v.Car_Type
      FROM Trip t
      JOIN Passenger p ON t.Trip_Passenger_ID = p.Passenger_ID
      JOIN Drivers d ON t.Trip_Driver_ID = d.Driver_ID
      JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
      WHERE t.Trip_ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trip status
app.put('/api/trips/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get driver ID for this trip
    const [trips] = await pool.query(
      'SELECT Trip_Driver_ID FROM Trip WHERE Trip_ID = ?',
      [req.params.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const driverId = trips[0].Trip_Driver_ID;

    // Update trip status
    await pool.query(
      'UPDATE Trip SET Trip_Status = ? WHERE Trip_ID = ?',
      [status, req.params.id]
    );

    // If trip is completed or cancelled, set driver to available
    if (status === 'Completed' || status === 'Cancelled') {
      await pool.query(
        'UPDATE Drivers SET Current_Status = "Available" WHERE Driver_ID = ?',
        [driverId]
      );
    }

    res.json({ message: 'Trip status updated successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- PAYMENT ENDPOINTS ---

// Create payment for a trip
app.post('/api/payments', async (req, res) => {
  try {
    const { trip_id, payment_type, payment_amount } = req.body;
    
    // Check if trip exists
    const [trips] = await pool.query(
      'SELECT Trip_Status FROM Trip WHERE Trip_ID = ?',
      [trip_id]
    );
    
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Only allow payments for completed trips
    if (trips[0].Trip_Status !== 'Completed') {
      return res.status(400).json({ error: 'Payment can only be made for completed trips' });
    }
    
    // Generate a unique payment ID (timestamp + random digits)
    const payment_id = Date.now() + Math.floor(Math.random() * 1000);
    
    const [result] = await pool.query(
      `INSERT INTO Payment (Payment_ID, Trip_ID, Payment_Type, Payment_Amount, Payment_Status) 
       VALUES (?, ?, ?, ?, 'Completed')`,
      [payment_id, trip_id, payment_type, payment_amount]
    );
    
    res.status(201).json({ 
      message: 'Payment processed successfully',
      payment_id: payment_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATISTICS ENDPOINTS ---

// Get driver ratings by car type
app.get('/api/stats/ratings-by-car-type', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          v.Car_Type, 
          ROUND(AVG(d.Rating), 2) AS Average_Rating, 
          MIN(d.Rating) AS Lowest_Rating,
          MAX(d.Rating) AS Highest_Rating,
          COUNT(d.Driver_ID) AS Driver_Count
      FROM Drivers d
      JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
      GROUP BY v.Car_Type
      HAVING COUNT(d.Driver_ID) > 0 
      ORDER BY Average_Rating DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get age statistics
app.get('/api/stats/age', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          'Drivers' AS User_Type,
          ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
          MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
          MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age
       FROM Drivers
       UNION
       SELECT 
          'Passengers' AS User_Type,
          ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
          MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
          MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age
       FROM Passenger
       ORDER BY User_Type`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get passengers by age group
app.get('/api/stats/passengers-by-age', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          CASE 
              WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) < 20 THEN 'Under 20'
              WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 20 AND 25 THEN '20-25'
              WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 26 AND 30 THEN '26-30'
              WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 31 AND 40 THEN '31-40'
              ELSE 'Over 40'
          END AS Age_Group,
          COUNT(*) AS Passenger_Count
      FROM 
          Passenger
      GROUP BY 
          Age_Group
      ORDER BY 
          CASE 
              WHEN Age_Group = 'Under 20' THEN 1
              WHEN Age_Group = '20-25' THEN 2
              WHEN Age_Group = '26-30' THEN 3
              WHEN Age_Group = '31-40' THEN 4
              ELSE 5
          END
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate random fare between 100 and 500
function calculateFare() {
  const baseFare = 50; 
  const distanceCharge = Math.floor(Math.random() * 100); // simulate with random charge
  return baseFare + distanceCharge;
}

// --- SQL QUERY INTERFACE ENDPOINT ---

// Execute SQL query
app.post('/api/execute-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    // List of allowed SELECT queries
    const allowedQueries = [
      // Query 1: Top Available Drivers
      `SELECT d.Driver_Name, d.Rating, v.Car_Model, v.Car_Type
       FROM Drivers d
       JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
       WHERE d.Current_Status = 'Available'
       ORDER BY d.Rating DESC
       LIMIT 5`,
      
      // Query 2: Off-Duty Drivers
      `SELECT d.Driver_Name, d.Rating, v.Car_Model, v.Car_Type
       FROM Drivers d
       JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
       WHERE d.Current_Status = 'Off Duty'
       ORDER BY d.Rating DESC`,
      
      // Query 3: Age Demographics
      `SELECT 
          'Drivers' AS User_Type,
          ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
          MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
          MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age
       FROM Drivers
       UNION
       SELECT 
          'Passengers' AS User_Type,
          ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
          MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
          MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age
       FROM Passenger
       ORDER BY User_Type`,
      
      // Query 4: Popular Car Models
      `SELECT v.Car_Model, COUNT(*) as Driver_Count
       FROM Vehicle v
       JOIN Drivers d ON v.Car_No = d.Driver_Car_No
       GROUP BY v.Car_Model
       ORDER BY Driver_Count DESC
       LIMIT 5`,
       
      // Query 5: Driver Ratings by Car Type
      `SELECT 
          v.Car_Type, 
          ROUND(AVG(d.Rating), 2) AS Average_Rating, 
          MIN(d.Rating) AS Lowest_Rating,
          MAX(d.Rating) AS Highest_Rating,
          COUNT(d.Driver_ID) AS Driver_Count
       FROM Drivers d
       JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
       GROUP BY v.Car_Type
       HAVING COUNT(d.Driver_ID) > 0 
       ORDER BY Average_Rating DESC`,

      // Query 6: Passengers with Bookings but No Completed Trips
      `SELECT 
          P.Passenger_ID, 
          P.Name,
          P.Contact_Number,
          COUNT(B.Booking_Passenger_ID) AS Number_Of_Bookings
       FROM Passenger P
       INNER JOIN Booking B ON P.Passenger_ID = B.Booking_Passenger_ID
       LEFT JOIN Trip T ON P.Passenger_ID = T.Trip_Passenger_ID
       WHERE T.Trip_ID IS NULL
       GROUP BY P.Passenger_ID, P.Name, P.Contact_Number
       ORDER BY Number_Of_Bookings DESC`,

      // Query 7: Passengers with Mismatched Pickup Locations
      `SELECT 
          p.Passenger_ID, 
          p.Name, 
          p.Pickup_Location AS Stored_Location,
          b.Pickup_Location AS Booking_Location
       FROM 
          Passenger p
       JOIN 
          Booking b ON p.Passenger_ID = b.Booking_Passenger_ID
       WHERE 
          p.Pickup_Location IS NOT NULL 
          AND b.Pickup_Location IS NOT NULL
          AND p.Pickup_Location != b.Pickup_Location
       ORDER BY 
          p.Name`
    ];

    // Check if the query is in the allowed list
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const isAllowed = allowedQueries.some(allowedQuery => 
      allowedQuery.replace(/\s+/g, ' ').trim() === normalizedQuery
    );

    if (!isAllowed) {
      return res.status(403).json({ 
        error: 'Query not allowed. Only predefined SELECT queries are permitted.' 
      });
    }

    // Execute the query
    const [rows] = await pool.query(query);
    res.json(rows);

  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ error: 'Query execution failed: ' + error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`GoWheels API running at http://localhost:${port}`);
});