/**
 * 创建超级管理员账号脚本
 * 用于在生产环境中添加初始管理员账号
 * 
 * 使用方法（在服务器上执行）：
 * docker compose exec web node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  // 超管账号信息
  const adminName = '卢金旭';
  const adminPassword = 'samsung360';
  const adminRole = 'superadmin';
  
  // 所有权限
  const allPermissions = JSON.stringify([
    'dashboard',
    'excel-processor', 
    'gene-editing',
    'mutation-highlight',
    'sequence-sorting',
    'report-generator',
    'files',
    'reports',
    'image-editor',
    'users',
    'settings'
  ]);

  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { name: adminName }
    });

    if (existingUser) {
      console.log(`⚠️  用户 "${adminName}" 已存在，正在更新为超级管理员...`);
      
      // 更新现有用户为超管
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.user.update({
        where: { name: adminName },
        data: {
          password: hashedPassword,
          role: adminRole,
          permissions: allPermissions
        }
      });
      
      console.log(`✅ 用户 "${adminName}" 已更新为超级管理员`);
    } else {
      // 创建新用户
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await prisma.user.create({
        data: {
          name: adminName,
          password: hashedPassword,
          role: adminRole,
          permissions: allPermissions
        }
      });
      
      console.log(`✅ 超级管理员 "${adminName}" 创建成功！`);
    }

    console.log('\n📋 账号信息：');
    console.log(`   用户名: ${adminName}`);
    console.log(`   密码: ${adminPassword}`);
    console.log(`   角色: ${adminRole}`);
    console.log('\n🔒 请登录后立即修改密码！');

  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
