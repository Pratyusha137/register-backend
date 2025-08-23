const express = require('express');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());

// Example route
app.post('/api/register', (req, res) => {
    const user = req.body;
    console.log(user);
    res.json({ message: 'User registered successfully!' });
});

// Start server
app.listen(port, () => {
    console.log(`✅ API ready on http://localhost:${port}`);
});
