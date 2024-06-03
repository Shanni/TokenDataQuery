// src/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UniswapService } from 'src/uniswap/uniswap.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly uniswapService: UniswapService) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'fetchTokenDataEveryHour',
  })
  handleCron() {
    this.uniswapService.fetchToken7DaysData('WBTC');
    this.uniswapService.fetchToken7DaysData('GNO');
    this.uniswapService.fetchToken7DaysData('SHIB');

    this.logger.debug('Running token fetch task every hour');
  }
}
