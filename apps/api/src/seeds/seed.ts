import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { UserRole } from '@shared/types/user.types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('🌱 Starting database seed...');

  try {
    // Get User model
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    // Check if super admin already exists
    const existingAdmin = await userModel.findOne({
      email: 'admin@vtexday.com.br'
    });

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('VtexDay2026@Admin', 10);

      // Create super admin user
      const adminUser = new userModel({
        email: 'admin@vtexday.com.br',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        profile: {
          name: 'Administrador VTEX Day',
          phone: '+5511999999999',
          company: 'VTEX',
          position: 'System Administrator',
          language: 'pt-BR'
        },
        preferences: {
          interests: [],
          notificationsEnabled: true,
          favoriteSessionIds: []
        },
        isActive: true,
        isValidated: true
      });

      await adminUser.save();
      console.log('✅ Super admin created successfully');
      console.log('📧 Email: admin@vtexday.com.br');
      console.log('🔑 Password: VtexDay2026@Admin');
    }

    // You can add more seed data here for other entities
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('-------------------');
    console.log('Email: admin@vtexday.com.br');
    console.log('Password: VtexDay2026@Admin');
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();