import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as rx from 'rxjs';
import { AxiosError } from 'axios';
import { response } from 'express';

import { FetchTokenService } from 'src/fetch-token/fetch-token.service';

enum TokenAddresses {
  WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  SHIB = '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
  GNO = '0x6810e776880c02933d47db1b9fc05908e5386b96',
}

@Injectable()
export class UniswapService {
  logger = new Logger('UniswapService');

  endpointUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

  constructor(
    private httpService: HttpService,
    private tokenService: FetchTokenService,
  ) {}

  async fetchToken(tokenSymbol: string) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    if (!tokenAddress) {
      throw new HttpException('Token not supported', HttpStatus.FORBIDDEN);
    }

    const query = `
    query Query($id: ID!) {
        token(id: $id) {
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
                open
                close
                high
                low
                priceUSD
            }
          }
        `;

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
        `fetchToken7DaysData ${tokenSymbol} Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (err) {
      this.logger.log(
        `fetchToken7DaysData ${tokenSymbol} Error: ${JSON.stringify(
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

  async fetchToken7DaysData(tokenSymbol: string) {
    const dates = this.generate7DaysDateArray(); // Generate the array of Date objects

    // Use Promise.allSettled to handle each promise independently
    const results = await Promise.allSettled(
      dates.map((date) => this.fetchTokenDataWithTime(tokenSymbol, date)),
    );

    // Process the results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.logger.log(
          `Data Token ${tokenSymbol} from ${dates[index].toISOString()}:`,
          result.value,
        );
      } else {
        this.logger.log(
          `Error ${tokenSymbol} for ${dates[index].toISOString()}:`,
          result.reason,
        );
      }
    });
  }

  async updateTokenData(tokenSymbol: string) {
    // Fetch token data, save it to the database
    const token = await this.fetchToken(tokenSymbol);
    await this.tokenService.saveTokenData(token);

    // Fetch 7 days data for the token, save it to the database
    await this.fetchTokenDataWithTime(tokenSymbol, new Date());
  }

  async getTokenData(tokenSymbol: string, intervalInDays: number) {
    throw new Error('Method not implemented.' + tokenSymbol + intervalInDays);
  }
}
