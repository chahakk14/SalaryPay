import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Salary Automation API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const defaultPort = 3000;
  const requestedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
  const initialPort = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : defaultPort;
  const portsToTry = [initialPort, defaultPort, 0].filter((p, index, self) => self.indexOf(p) === index && p >= 0);

  for (const portToTry of portsToTry) {
    try {
      await app.listen(portToTry);
      const url = await app.getUrl();
      console.log(`Server running on ${url}`);
      return;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE') {
        console.warn(`Port ${portToTry} is already in use.`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('Could not bind to any available port.');
}
bootstrap();
