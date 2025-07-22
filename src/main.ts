import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply JWT Guard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Inventory Management System API')
    .setDescription(
      'Comprehensive Inventory Management System for Small Businesses - Manage inventory, sales, and orders efficiently',
    )
    .setVersion('1.0')
    .addTag('Authentication')
    .addTag('Inventory Management')
    .addTag('Sales Management')
    .addTag('Reports & Analytics')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  // Force IPv4 binding to avoid Windows IPv6 permission issues
  const host = process.env.HOST ?? '127.0.0.1';

  console.log(`Starting server on host: ${host}, port: ${port}`);

  try {
    await app.listen(port, host);
    console.log(
      `🚀 Inventory Management System is running on: http://${host}:${port}`,
    );
    console.log(
      `📚 API Documentation available at: http://${host}:${port}/api`,
    );
    console.log(
      `📊 Features: Inventory Management | Sales Processing | Order Fulfillment | Analytics & Reports`,
    );
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.log('Trying alternative port 8080...');
    try {
      await app.listen(8080, host);
      console.log(
        `🚀 Inventory Management System is running on: http://${host}:8080`,
      );
      console.log(`📚 API Documentation available at: http://${host}:8080/api`);
    } catch (fallbackError) {
      console.error('Failed to start on fallback port:', fallbackError.message);
      process.exit(1);
    }
  }
}
bootstrap();
