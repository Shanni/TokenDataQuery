import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as rx from 'rxjs';
import { AxiosError } from 'axios';
import { response } from 'express';
import { TokenService } from 'src/token/token.service';
import { TokenAddresses } from 'src/token/token.enum';

/**
 * Service to interact with the Uniswap V3 GraphQL API.
 */
@Injectable()
export class UniswapService {
  logger = new Logger('UniswapService');

  endpointUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService,
  ) {}

  /**
   * Fetches token details from the Uniswap subgraph by token symbol.
   * @param {string} tokenSymbol The symbol of the token to fetch.
   * @returns {Promise<any>} The GraphQL response containing token details.
   * @throws {HttpException} If the token symbol is not supported.
   */
  async fetchToken(tokenSymbol: string) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    if (!tokenAddress) {
      throw new HttpException('Token not supported', HttpStatus.FORBIDDEN);
    }

    const query = `
    query Query($id: ID!) {
        token(id: $id) {
          id
          name
          symbol
          totalSupply
          volumeUSD
          decimals
        }
      }
    `;

    const body = {
      query,
      variables: {
        id: tokenAddress,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    this.logger.log(`fetchToken ${tokenSymbol}: ${JSON.stringify(body)}`);
    try {
      const res = await rx.lastValueFrom(
        this.httpService
          .post(this.endpointUrl, body)
          .pipe(rx.map((response) => response.data)),
      );
      this.logger.log(
        `fetchToken Response ${tokenSymbol}: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (err) {
      this.logger.log(
        `fetchToken Error: ${JSON.stringify(
          (err as AxiosError)?.response?.data,
        )}`,
      );
      const responseBody = {
        error: 'Uniswap GraphQL Error',
        detail: (err as AxiosError)?.response?.data,
      };
      return response
        .status((err as AxiosError)?.response?.status || 500)
        .json(responseBody);
    }
  }

  /**
   * Fetches historical token data based on a specific time.
   * @param {string} tokenSymbol The token's symbol.
   * @param {Date} time The date and time for which to fetch the data.
   * @returns {Promise<any>} The GraphQL response containing historical data.
   * @throws {HttpException} If the token symbol is not supported.
   */
  async fetchTokenDataWithTime(tokenSymbol: string, time: Date) {
    // Get the token address
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    if (!tokenAddress) {
      throw new HttpException('Token not supported', HttpStatus.FORBIDDEN);
    }

    // Calculate the time, and get the integer value
    const timeTruc = (time.getTime() / 3600 / 1000) | 0;

    const query = `
        query Query($id: ID!) {
            tokenHourData(id: $id) {
                id
                open
                close
                high
                low
                priceUSD
                periodStartUnix
            }
          }
        `;

    this.logger.log(
      `fetchTokenDataWithTime ${tokenSymbol}: ${JSON.stringify(query)}`,
    );
    const body = {
      query,
      variables: {
        id: `${tokenAddress}-${timeTruc}`,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await rx.lastValueFrom(
        this.httpService
          .post(this.endpointUrl, body)
          .pipe(rx.map((response) => response.data)),
      );
      this.logger.log(
        `fetchTokenDataWithTime ${tokenSymbol} Response: ${JSON.stringify(
          res,
        )}`,
      );
      return res;
    } catch (err) {
      this.logger.log(
        `fetchTokenDataWithTime ${tokenSymbol} Error: ${JSON.stringify(
          (err as AxiosError)?.response?.data,
        )}`,
      );
      const responseBody = {
        error: 'Uniswap fetchTokenDataWithTime GraphQL Error',
        detail: (err as AxiosError)?.response?.data,
      };
      return response
        .status((err as AxiosError)?.response?.status || 500)
        .json(responseBody);
    }
  }

  /**
   * Generates an array of Date objects representing each hour for the last 7 days.
   * This utility function is useful for retrieving time-series data.
   * @returns {Date[]} An array of Date objects.
   */
  generate7DaysDateArray() {
    const dates = [];
    const endDate = new Date(); // Current date and time
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    for (
      let date = startDate;
      date <= endDate;
      date.setHours(date.getHours() + 1)
    ) {
      dates.push(new Date(date)); // Push a copy of the date to the array
    }

    return dates;
  }

  /**
   * Fetches token data for the last 7 days from the Uniswap API and saves it to the database.
   * It fetches the data hourly over the last 7 days and handles each fetch independently.
   *
   * @param {string} tokenSymbol The symbol of the token for which data is being fetched.
   * @returns {Promise<void>} Completes when all data has been fetched and saved.
   * @throws {HttpException} If any fetch encounters a problem, logs the error without throwing to avoid stopping the batch process.
   */
  async fetchToken7DaysData(tokenSymbol: string) {
    const dates = this.generate7DaysDateArray(); // Generate the array of Date objects

    // Use Promise.allSettled to handle each promise independently
    const results = await Promise.allSettled(
      dates.map((date) => this.fetchTokenDataWithTime(tokenSymbol, date)),
    );

    this.logger.log('Results:', results);

    // Process each result, attempting to save the data to the database
    const promises = [];
    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        this.logger.log(
          `Data Token ${tokenSymbol} from ${dates[index].toISOString()}:`,
          result.value,
        );
        const tokenPriceData = result.value.data.tokenHourData;
        // Push the save operation as a promise into the promises array
        promises.push(this.tokenService.saveTokenPriceData(tokenPriceData));
      } else {
        this.logger.log(
          `Error ${tokenSymbol} for ${dates[index].toISOString()}:`,
          result.reason,
        );
      }
    }

    try {
      // Await all save operations
      const responses = await Promise.all(promises);
      this.logger.log('All token price data saved successfully:', responses);
    } catch (error) {
      this.logger.error('Error in saving token price data:', error);
    }
  }
}
