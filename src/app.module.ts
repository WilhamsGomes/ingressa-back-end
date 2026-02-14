import { Module } from '@nestjs/common';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpLoggingInterceptor } from './shared/interceptors/http-logging.interceptor';
import { LoggerModule } from './shared/logger/logger.module';
import { AuthGuard } from './modules/auth/infra/guards/auth.guard';

@Module({
  imports: [
    EventsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
