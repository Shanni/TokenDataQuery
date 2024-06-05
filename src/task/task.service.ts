// src/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from 'src/token/token.service';
import { UniswapService } from 'src/uniswap/uniswap.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly uniswapService: UniswapService,
    private readonly tokenService: TokenService,
  ) {
    this.startOneTimeTask();
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'fetchTokenDataEveryHour',
  })
  handleCron() {
    this.updateTokenData('WBTC');
    // this.uniswapService.updateTokenData('GNO');
    // this.uniswapService.updateTokenData('SHIB');

    this.logger.debug('Running token fetch task every hour');
  }

  startOneTimeTask() {
    this.createTokenData('WBTC');
    // this.uniswapService.fetchToken7DaysData('GNO');
    // this.uniswapService.fetchToken7DaysData('SHIB');
  }

  /**
   * function to create token data and token price data in cron job, call at the start of the application
   *
   * @param tokenSymbol
   */
  async createTokenData(tokenSymbol: string) {
    // Fetch token data, save it to the database
    const token = await this.uniswapService.fetchToken(tokenSymbol);
    this.logger.log('Token data???????:', token);
    await this.tokenService.saveTokenData(token.data.token);
    this.logger.log('Token data saved:', token.data.token);

    // Fetch 7 days data for the token, save it to the database
    await this.uniswapService.fetchToken7DaysData(tokenSymbol);
  }

  /**
   * function to update token data and token price data in cron job, every 1 hour
   *
   * @param tokenSymbol
   */
  async updateTokenData(tokenSymbol: string) {
    // Fetch token data, save it to the database
    const token = await this.uniswapService.fetchToken(tokenSymbol);
    await this.tokenService.saveTokenData(token);

    // Fetch 7 days data for the token, save it to the database
    await this.uniswapService.fetchTokenDataWithTime(tokenSymbol, new Date());
  }
}
