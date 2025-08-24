const express = require('express');
const Lead = require('../models/Lead');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create lead
router.post('/', authMiddleware, async (req, res) => {
  try {
    const lead = new Lead({ ...req.body, user: req.user.id });
    await lead.save();
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// List leads with pagination and filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const query = { user: req.user.id };

    // String filters (equals, contains)
    ['email', 'company', 'city'].forEach((field) => {
      if (filters[field]) {
        query[field] = filters[field].startsWith('contains:') 
          ? { $regex: filters[field].replace('contains:', ''), $options: 'i' }
          : filters[field];
      }
    });

    // Enum filters
    ['source', 'status'].forEach((field) => {
      if (filters[field]) {
        query[field] = filters[field].startsWith('in:') 
          ? { $in: filters[field].replace('in:', '').split(',') }
          : filters[field];
      }
    });

    // Number filters
    ['score', 'lead_value'].forEach((field) => {
      if (filters[field]) {
        if (filters[field].startsWith('between:')) {
          const [min, max] = filters[field].replace('between:', '').split(',');
          query[field] = { $gte: Number(min), $lte: Number(max) };
        } else if (filters[field].startsWith('gt:')) {
          query[field] = { $gt: Number(filters[field].replace('gt:', '')) };
        } else if (filters[field].startsWith('lt:')) {
          query[field] = { $lt: Number(filters[field].replace('lt:', '')) };
        } else {
          query[field] = Number(filters[field]);
        }
      }
    });

    // Date filters
    ['created_at', 'last_activity_at'].forEach((field) => {
      if (filters[field]) {
        if (filters[field].startsWith('between:')) {
          const [start, end] = filters[field].replace('between:', '').split(',');
          query[field] = { $gte: new Date(start), $lte: new Date(end) };
        } else if (filters[field].startsWith('before:')) {
          query[field] = { $lt: new Date(filters[field].replace('before:', '')) };
        } else if (filters[field].startsWith('after:')) {
          query[field] = { $gt: new Date(filters[field].replace('after:', '')) };
        } else {
          query[field] = new Date(filters[field]);
        }
      }
    });

    // Boolean filter
    if (filters.is_qualified) {
      query.is_qualified = filters.is_qualified === 'true';
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .skip((page - 1) * limit)
      .limit(Math.min(limit, 100))
      .sort({ created_at: -1 });

    res.status(200).json({
      data: leads,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single lead
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, user: req.user.id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update lead
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete lead
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;