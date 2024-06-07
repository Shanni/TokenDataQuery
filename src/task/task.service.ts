// src/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from 'src/token/token.service';
import { UniswapService } from 'src/uniswap/uniswap.service';

/**
 * Manages scheduled and initial tasks for token data fetching and updating in a NestJS application.
 * This service integrates with the UniswapService and TokenService to maintain up-to-date token data in the local database.
 * It's designed to perform tasks both at the start of the application and at scheduled intervals.
 *
 * @class TaskService
 */
@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly uniswapService: UniswapService,
    private readonly tokenService: TokenService,
  ) {
    this.startOneTimeTask();
  }

  /**
   * Executes the token data fetching task every hour as per the defined cron job.
   * This method is scheduled to run via a cron expression and logs the operation.
   *
   * @remarks
   * This method primarily updates data for the WBTC token as an example. Additional or different tokens can be configured as needed.
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'fetchTokenDataEveryHour',
  })
  handleCron() {
    this.updateTokenData('WBTC');
    this.updateTokenData('GNO');
    this.updateTokenData('SHIB');

    this.logger.debug('Running token fetch task every hour');
  }

  /**
   * Initiates a one-time task at application startup to create initial token data.
   * This method fetches and stores initial data and 7-day historical data for the WBTC token.
   *
   * @remarks
   * This method is intended to be called once at service initialization to prepare the initial state of token data.
   */
  startOneTimeTask() {
    this.createTokenData('WBTC');
    this.createTokenData('GNO');
    this.createTokenData('SHIB');
  }

  /**
   * Initializes token data at application start. This function fetches the initial token data and historical price data for the past 7 days from the Uniswap service, then stores it in the local database.
   * This method should be called once when the service starts to initialize token information.
   *
   * @param tokenSymbol The symbol of the token to fetch data for, e.g., 'WBTC'. This should match an available token in the Uniswap service.
   * @throws {ServiceError} Throws an error if fetching from the Uniswap service fails or data saving operations fail.
   * @returns {void} Nothing is returned by this method, but it triggers asynchronous operations to update the database.
   * @example
   * // Initialize data for Bitcoin Wrapped Token
   * await createTokenData('WBTC');
   */
  async createTokenData(tokenSymbol: string) {
    // Fetch token data, save it to the database
    const token = await this.uniswapService.fetchToken(tokenSymbol);
    await this.tokenService.saveTokenData(token.data.token);
    this.logger.log('Token data saved:', token.data.token);

    // Fetch 7 days data for the token, save it to the database
    await this.uniswapService.fetchToken7DaysData(tokenSymbol);
  }

  /**
   * Updates the token data every hour as per the scheduled cron job. This function fetches the latest token data and updates the historical price data by including the current date's prices from the Uniswap service, then stores these updates in the database.
   * It's designed to be triggered by a cron job and ensures the token data is current and reflective of the latest market conditions.
   *
   * @param tokenSymbol The symbol of the token for which data is being updated, e.g., 'WBTC'. This symbol should correspond to an active token in the Uniswap service.
   * @throws {ServiceError} Throws an error if there is a failure in fetching data from Uniswap or during the database update operations.
   * @returns {void} This method returns nothing but triggers asynchronous database updates with the latest data.
   * @example
   * // Scheduled update for Bitcoin Wrapped Token
   * updateTokenData('WBTC');
   *
   * @performance The performance of this method depends on the response time from the Uniswap service and the database's write throughput. It's expected to run efficiently under normal operational conditions but may be slower during periods of high network congestion or if the database is under heavy load.
   */
  async updateTokenData(tokenSymbol: string) {
    // Fetch current token data from Uniswap
    const token = await this.uniswapService.fetchToken(tokenSymbol);
    await this.tokenService.saveTokenData(token);

    // Update historical data with today's prices
    await this.uniswapService.fetchTokenDataWithTime(tokenSymbol, new Date());
  }
}
