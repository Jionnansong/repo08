const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Ensure default admin user
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('Created admin user (username: admin, password: 123456)');
  } else {
    console.log('Admin user already exists');
  }

  // Ensure default system settings
  const defaultSettings = [
    { key: 'systemName', value: 'VibeFile Cloud' },
    { key: 'allowedExtensions', value: '.jpg,.png,.gif,.pdf,.zip,.rar,.txt,.mp4,.mp3,.docx,.xlsx' },
    { key: 'maxFileSize', value: '100' }, // in MB
    { key: 'registrationEnabled', value: 'true' }
  ];

  for (const setting of defaultSettings) {
    const existing = await prisma.setting.findUnique({
      where: { key: setting.key }
    });
    if (!existing) {
      await prisma.setting.create({
        data: setting
      });
      console.log(`Created default setting: ${setting.key} = ${setting.value}`);
    }
  }

  console.log('Seeding finished.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = main;
