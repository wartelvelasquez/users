import * as dotenv from "dotenv";
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions } from "@nestjs/microservices";
import { KafkaServer } from "./kafka.server";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AllRpcExceptionsFilter } from "./common/filters/rpc-exception.filter";

async function bootstrap() {
  const logger = new Logger("Main");

  const urlBroker = process.env.URL_BROKER;
  const kfUsername = process.env.KFUSERNAME;
  const kfPassword = process.env.KFPASSWORD;
  const groupId = process.env.GROUP_ID_KAFKA;

  if (!urlBroker) {
    logger.error(
      "ERROR: URL_BROKER is not configured. This microservice requires Kafka to function."
    );
    logger.error("Please configure the following environment variables:");
    logger.error("  - URL_BROKER (required)");
    logger.error("  - KFUSERNAME (optional, for SASL authentication)");
    logger.error("  - KFPASSWORD (optional, for SASL authentication)");
    logger.error("  - GROUP_ID_KAFKA (optional, defaults to DEFAULT_GROUP_ID)");
    process.exit(1);
  }

  // Configurar SASL solo si hay credenciales
  const saslConfig =
    kfUsername && kfPassword
      ? {
          mechanism: "plain" as const,
          username: kfUsername,
          password: kfPassword,
        }
      : undefined;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new KafkaServer({
        client: {
          brokers: [urlBroker],
          ssl: false,
          sasl: saslConfig,
        },
        consumer: {
          groupId: groupId || "DEFAULT_GROUP_ID",
        },
      }),
    }
  );

  // Configurar filtros globales para mejor manejo de errores
  app.useGlobalFilters(new AllRpcExceptionsFilter());

  // Configurar pipes de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return {
          statusCode: 400,
          message: "Validation failed",
          errors: messages,
        };
      },
    })
  );

  await app.listen();
  logger.log("Configuration Microservice Started");
  logger.log(`Kafka Broker: ${urlBroker}`);
  logger.log(`Consumer Group: ${groupId}`);
  logger.log(`SASL Authentication: ${saslConfig ? "Enabled" : "Disabled"}`);
  logger.log("Global exception filter enabled");
  logger.log("Global validation pipe enabled");
  logger.debug("Listening for messages on topics");
}

bootstrap();
