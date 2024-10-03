const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
app.use(bodyParser.json());

// Database configuration
const config = {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    server: process.env.DATABASE_SERVER,
    database: process.env.DATABASE_NAME,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

// Connect to database
let pool;
const connectToDatabase = async () => {
    try {
        pool = await sql.connect(config);
        console.log('Connected to database');
    } catch (err) {
        console.error('Database Connection Failed! Bad Config: ', err);
        process.exit(1);
    }
};

connectToDatabase();

// GET all students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM students');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'An error occurred while fetching students' });
    }
});

// POST a new student
app.post('/api/students', async (req, res) => {
    try {
        const { name, email } = req.body;
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .query('INSERT INTO students (name, email) VALUES (@name, @email); SELECT SCOPE_IDENTITY() AS id');
        res.status(201).json({ id: result.recordset[0].id, name, email });
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ error: 'An error occurred while creating the student' });
    }
});

// DELETE a student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM students WHERE id = @id');
        if (result.rowsAffected[0] === 0) {
            res.status(404).json({ error: 'Student not found' });
        } else {
            res.json({ message: 'Student deleted successfully' });
        }
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ error: 'An error occurred while deleting the student' });
    }
});

// PUT (update) a student
app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .query('UPDATE students SET name = @name, email = @email WHERE id = @id');
        if (result.rowsAffected[0] === 0) {
            res.status(404).json({ error: 'Student not found' });
        } else {
            res.json({ message: 'Student updated successfully' });
        }
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ error: 'An error occurred while updating the student' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));