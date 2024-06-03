import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FetchTokenController } from './fetch-token/fetch-token.controller';
import { UniswapService } from './uniswap/uniswap.service';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from './task/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ResourceModule } from './resource/resource.module';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot(), ResourceModule],
  controllers: [AppController, FetchTokenController],
  providers: [AppService, UniswapService, TaskService],
})
export class AppModule {}
