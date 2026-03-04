import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/config/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SessionModule } from './modules/session/session.module';
import { QuestionModule } from './modules/question/question.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LogsModule } from './modules/logs/logs.module';
import { ProjectModule } from './modules/project/project.module';
import { ResponseModule } from './modules/response/response.module';
import { ActorModule } from './modules/actor/actor.module';
import { ResultModule } from './modules/result/result.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GovbrModule } from './modules/govbr/govbr.module';
import { ClassificationLevelModule } from './modules/classification-level/classification-level.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LogsModule,
    DatabaseModule,
    AuthModule,
    AdminModule,
    SessionModule,
    QuestionModule,
    ProjectModule,
    ResponseModule,
    ActorModule,
    ResultModule,
    DashboardModule,
    GovbrModule,
    ClassificationLevelModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [DatabaseModule],
})
export class AppModule {}
