const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: { files: true }
        }
      }
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to retrieve user accounts' });
  }
}

async function createUser(req, res) {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'user'
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { username, password, role } = req.body;
  const userId = parseInt(id);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Edge case: if setting role of self from admin to user, block
    if (userId === req.user.id && role && role !== user.role) {
      return res.status(400).json({ error: 'You cannot change your own admin role' });
    }

    const updateData = {};
    if (username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Username already in use' });
      }
      updateData.username = username;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      updateData.role = role;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user account' });
  }
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const userId = parseInt(id);

  try {
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account in the system' });
      }
    }

    // Delete user's files and clear actual files from storage if needed
    // In our implementation, we'll delete files record
    await prisma.file.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'User and all their files deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
