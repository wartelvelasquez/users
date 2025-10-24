import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { KafkaServer } from './kafka.server';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main');

  const urlBroker = process.env.URL_BROKER;
  const kfUsername = process.env.KFUSERNAME;
  const kfPassword = process.env.KFPASSWORD;
  const groupId = process.env.GROUP_ID_KAFKA;

  if (!urlBroker || !kfUsername || !kfPassword) {
    console.warn('⚠️  Kafka variables not configured, skipping Kafka microservice setup');
    // Solo crear la aplicación HTTP sin Kafka
    const httpApp = await NestFactory.create(AppModule);
    
    // Configurar CORS para webhooks
    httpApp.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Trulioo-Signature'],
      credentials: true,
    });
    
    // Configurar tamaño de payload para webhooks
    httpApp.use(require('express').json({ limit: '10mb' }));
    httpApp.use(require('express').urlencoded({ extended: true, limit: '10mb' }));
    
    await httpApp.listen(3000);
    logger.log('HTTP Application started on port 3000 (Kafka disabled)');
    logger.log('Webhook endpoint available at: http://localhost:3000/api/kyc/webhooks/trulioo');
    return;
  }

  // Topics suscritos por el microservicio
  const subscribedTopics = [
    'user.create',
    'user.findAll',
    'user.findById',
    'user.update',
    'user.delete',
    'user.health',
  ];

  // Mostrar información de configuración de Kafka
  logger.log('\n' + '='.repeat(70));
  logger.log('🚀 KAFKA CONFIGURATION');
  logger.log('='.repeat(70));
  logger.log(`📡 Broker: ${urlBroker}`);
  logger.log(`👤 Username: ${kfUsername}`);
  logger.log(`🔐 Authentication: SASL/PLAIN`);
  logger.log(`👥 Consumer Group: ${groupId || `apigateway-consumer-${Date.now()}`}`);
  logger.log(`📋 Subscribed Topics (${subscribedTopics.length}):`);
  subscribedTopics.forEach((topic, index) => {
    logger.log(`   ${index + 1}. ${topic}`);
  });
  logger.log('='.repeat(70) + '\n');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new KafkaServer({
        client: {
          brokers: [urlBroker],
          ssl: false,
          sasl: {
            mechanism: 'plain',
            username: kfUsername,
            password: kfPassword,
          },
        },
        consumer: {
          groupId: groupId || `apigateway-consumer-${Date.now()}`,
        },
      }),
    },
  );

  await app.listen();
  
  // Confirmación de conexión exitosa
  logger.log('\n' + '='.repeat(70));
  logger.log('✅ KAFKA CONNECTION SUCCESSFUL');
  logger.log('='.repeat(70));
  logger.log('🎯 Status: Connected and listening for messages');
  logger.log(`📡 Broker: ${urlBroker}`);
  logger.log(`👥 Consumer Group: ${groupId || 'apigateway-consumer-server'}`);
  logger.log(`📨 Ready to receive messages on ${subscribedTopics.length} topics`);
  logger.log('='.repeat(70) + '\n');
}

bootstrap();
