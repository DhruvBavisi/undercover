const express = require('express');
const mongoose = require('mongoose');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/groups', groupRoutes);

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
