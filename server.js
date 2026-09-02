const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Content = require('./models/Content');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: 'Admin Rights Required' });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ name, email, password: hashedPassword, role: role || 'user' });
    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: 'Invalid Password' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, role: user.role, name: user.name });
});

app.get('/api/content', async (req, res) => {
  const data = await Content.find().sort({ createdAt: -1 });
  res.json(data);
});

app.get('/api/content/:id', async (req, res) => {
  const item = await Content.findById(req.params.id);
  res.json(item);
});

app.post('/api/admin/content', verifyAdmin, async (req, res) => {
  try {
    const newContent = new Content(req.body);
    await newContent.save();
    res.json({ message: 'Content added successfully', data: newContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/content/:seriesId/season', verifyAdmin, async (req, res) => {
  const { seriesId } = req.params;
  const { seasonNumber, episodes } = req.body;
  try {
    const series = await Content.findById(seriesId);
    if (!series || series.type !== 'series') {
      return res.status(400).json({ message: 'Web Series not found' });
    }
    series.seasons.push({ seasonNumber, episodes });
    await series.save();
    res.json({ message: 'New Season added successfully!', data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
