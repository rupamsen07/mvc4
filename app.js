const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const formatAssignment = (assignment) => ({
  ...assignment,
  deadline: assignment.deadline instanceof Date
    ? assignment.deadline.toISOString().slice(0, 10)
    : assignment.deadline,
});

app.post('/assignments', async (req, res) => {
  const { title, deadline } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO assignments (title, deadline) VALUES ($1, $2) RETURNING *',
      [title, deadline]
    );

    return res.status(201).json(formatAssignment(result.rows[0]));
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/assignments', async (req, res) => {
  const { submitted } = req.query;

  try {
    if (submitted !== undefined) {
      const submittedValue = String(submitted).toLowerCase() === 'true';
      const result = await pool.query(
        'SELECT * FROM assignments WHERE submitted = $1 ORDER BY id DESC',
        [submittedValue]
      );
      return res.json(result.rows.map(formatAssignment));
    }

    const result = await pool.query(
      'SELECT * FROM assignments ORDER BY id DESC'
    );
    return res.json(result.rows.map(formatAssignment));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/assignments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE assignments SET submitted = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.json(formatAssignment(result.rows[0]));
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/assignments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM assignments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.json({
      message: 'Assignment deleted successfully',
      assignment: formatAssignment(result.rows[0]),
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

module.exports = app;
