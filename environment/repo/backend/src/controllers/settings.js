const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSettings(req, res) {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
}

async function updateSettings(req, res) {
  const updates = req.body; // Expect key-value dictionary e.g. { systemName: 'New Name' }

  try {
    for (const key of Object.keys(updates)) {
      const val = String(updates[key]);
      await prisma.setting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val }
      });
    }

    const allSettings = await prisma.setting.findMany();
    const settingsMap = {};
    allSettings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      message: 'System settings updated successfully',
      settings: settingsMap
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
