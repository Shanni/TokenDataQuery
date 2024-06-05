import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenController } from './token/token.controller';
import { UniswapService } from './uniswap/uniswap.service';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from './task/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ResourceModule } from './resource/resource.module';
import { DatabaseService } from './database/database.service';
import { TokenService } from './token/token.service';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot(), ResourceModule],
  controllers: [AppController, TokenController],
  providers: [
    AppService,
    UniswapService,
    TaskService,
    DatabaseService,
    TokenService,
  ],
})
export class AppModule {}
