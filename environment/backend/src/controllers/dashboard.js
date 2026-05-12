const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getStats(req, res) {
  try {
    const isUserAdmin = req.user.role === 'admin';
    const whereClause = isUserAdmin ? {} : { userId: req.user.id };

    // Total files count
    const totalFiles = await prisma.file.count({ where: whereClause });

    // Total users count (only admins see the true user count)
    const totalUsers = isUserAdmin ? await prisma.user.count() : 1;

    // Total storage used (sum of sizes)
    const filesForStorage = await prisma.file.findMany({
      where: whereClause,
      select: { size: true }
    });
    const totalStorage = filesForStorage.reduce((acc, f) => acc + f.size, 0);

    // File type distribution (by mimeType/category)
    const filesForTypes = await prisma.file.findMany({
      where: whereClause,
      select: { mimeType: true }
    });

    const categories = {
      Image: 0,
      Document: 0,
      Archive: 0,
      Media: 0,
      Other: 0
    };

    filesForTypes.forEach(f => {
      const mime = f.mimeType.toLowerCase();
      if (mime.startsWith('image/')) {
        categories.Image++;
      } else if (
        mime.includes('pdf') ||
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('officedocument') ||
        mime.includes('text')
      ) {
        categories.Document++;
      } else if (
        mime.includes('zip') ||
        mime.includes('tar') ||
        mime.includes('rar') ||
        mime.includes('7z') ||
        mime.includes('gzip')
      ) {
        categories.Archive++;
      } else if (mime.startsWith('audio/') || mime.startsWith('video/')) {
        categories.Media++;
      } else {
        categories.Other++;
      }
    });

    const typeDistribution = Object.keys(categories).map(name => ({
      name,
      value: categories[name]
    }));

    // Recent activity (latest 5 uploads)
    const recentUploads = await prisma.file.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Mock/Generate trend for last 7 days (real-ish query)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.file.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: d,
            lt: nextDay
          }
        }
      });

      trend.push({
        date: d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        uploads: count
      });
    }

    res.json({
      totalFiles,
      totalUsers,
      totalStorage, // in bytes
      typeDistribution,
      recentUploads: recentUploads.map(f => ({
        id: f.id,
        filename: f.filename,
        size: f.size,
        uploader: f.user.username,
        createdAt: f.createdAt
      })),
      trend
    });
  } catch (err) {
    console.error('Stats fetching error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
}

module.exports = {
  getStats
};
