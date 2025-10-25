import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CommonService } from './common.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientProvider,
  ClientsModule,
  Transport,
} from '@nestjs/microservices';
import { AppService } from '../app.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'USER-MICRO-SERVICE',
        useFactory: (configService: ConfigService): ClientProvider => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.getOrThrow('CLIENT_ID_KAFKA'),
              brokers: [configService.getOrThrow('URL_BROKER')],
              ssl: false,
              sasl: {
                mechanism: 'plain',
                username: configService.getOrThrow('KFUSERNAME'),
                password: configService.getOrThrow('KFPASSWORD'),
              },
            },
            consumer: {
              groupId: configService.getOrThrow('GROUP_ID_KAFKA'),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [CommonService, ClientsModule],

  providers: [
    CommonService, 
    AppService
  ],
})
export class CommonModule { }
