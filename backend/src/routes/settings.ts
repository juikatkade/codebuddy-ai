import express from 'express';
import User from '../models/User';

const router = express.Router();

router.post('/notifications', async (req, res) => {
  try {
    const { email, telegramUsername } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to save settings.' });
    }

    // Upsert user based on email (since it's a simple auth for the extension)
    let user = await User.findOne({ email });
    if (user) {
      user.telegramUsername = telegramUsername || user.telegramUsername;
      await user.save();
    } else {
      user = await User.create({ email, telegramUsername });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
