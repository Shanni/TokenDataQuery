import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { TokenAddresses } from 'src/token/token.enum';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { format } from 'date-fns';

/**
 * Provides methods for saving and retrieving token and token price data to/from a database. This service interacts closely with the DatabaseService to perform CRUD operations on token-related data.
 *
 * @class TokenService
 * @description Handles the storage, update, and retrieval of token data and token price data in a PostgreSQL database.
 */
@Injectable()
export class TokenService {
  logger = new Logger(TokenService.name);
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Saves token data to the database. It checks if the token already exists; if so, it updates the existing token, otherwise, it creates a new token record.
   *
   * @param {any} tokenData - The token data to save. Must include 'id', 'name', 'symbol', 'totalSupply', 'volumeUSD', and 'decimals'.
   * @throws {HttpException} Throws an HttpException with HttpStatus.BAD_REQUEST if tokenData is null or undefined.
   * @returns {Promise<any>} A promise that resolves with the saved or updated token record.
   */
  async saveTokenData(tokenData) {
    if (!tokenData) {
      throw new HttpException('Token data is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Check if token already exists
      let token = await this.databaseService.token.findUnique({
        where: {
          tokenAddress: tokenData.id,
        },
      });

      // If token exists, update token
      if (token) {
        this.logger.log('Token already exists, update token', token);
        token = await this.databaseService.token.update({
          where: {
            tokenAddress: tokenData.id,
          },
          data: {
            totalSupply: +tokenData.totalSupply,
            volumeUSD: +tokenData.volumeUSD,
          },
        });
        return token;
      }

      // If token does not exist, create token
      token = await this.databaseService.token.create({
        data: {
          tokenAddress: tokenData.id,
          name: tokenData.name,
          symbol: tokenData.symbol,
          totalSupply: +tokenData.totalSupply,
          volumeUSD: +tokenData.volumeUSD,
          decimals: +tokenData.decimals,
        },
      });
      this.logger.log('Token created:', token);
      return token;
    } catch (error) {
      this.logger.error('Failed to create token:', error);
      throw error;
    }
  }

  /**
   * Saves or updates token price data in the database. If the price data already exists, it updates the existing record, otherwise, it creates a new one.
   *
   * @param {any} tokenPriceData - The token price data to save or update. Must include 'id', 'open', 'close', 'high', 'low', 'priceUSD', 'periodStartUnix'.
   * @throws {HttpException} Throws an HttpException with HttpStatus.BAD_REQUEST if tokenPriceData is null or undefined.
   * @returns {Promise<any>} A promise that resolves with the created or updated token price record.
   */
  async saveTokenPriceData(tokenPriceData) {
    if (!tokenPriceData) {
      throw new HttpException(
        'Token price data is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tokenPrice = await this.databaseService.tokenPriceData.upsert({
        where: {
          id: tokenPriceData.id,
        },
        update: {
          tokenAddress: tokenPriceData.id.split('-')[0],
          id: tokenPriceData.id,
          open: +tokenPriceData.open,
          close: +tokenPriceData.close,
          high: +tokenPriceData.high,
          low: +tokenPriceData.low,
          priceUSD: +tokenPriceData.priceUSD,
          periodStartUnix: tokenPriceData.periodStartUnix,
        },
        create: {
          id: tokenPriceData.id,
          open: +tokenPriceData.open,
          close: +tokenPriceData.close,
          high: +tokenPriceData.high,
          low: +tokenPriceData.low,
          priceUSD: +tokenPriceData.priceUSD,
          periodStartUnix: tokenPriceData.periodStartUnix,
          token: {
            connect: {
              tokenAddress: tokenPriceData.id.split('-')[0],
            },
          },
        },
      });
      return tokenPrice;
    } catch (error) {
      this.logger.error('Failed to create token price:', error);
      throw error;
    }
  }

  /**
   * Retrieves a token's detailed data from the database using the token's symbol.
   *
   * @param {string} tokenSymbol - The symbol of the token to retrieve, corresponding to keys in `TokenAddresses`.
   * @returns {Promise<any>} A promise that resolves with the token data if found, or null if no token matches the provided symbol.
   */
  getToken(tokenSymbol: string) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    return this.databaseService.token.findUnique({
      where: {
        tokenAddress,
      },
    });
  }

  /**
   * Retrieves 7 days of price data for a specific token, filtered by the specified time unit in hours.
   * This method uses RxJS to handle asynchronous data streams, filtering and transforming the data appropriately.
   *
   * @param {string} tokenSymbol - The symbol of the token for which to retrieve price data.
   * @param {number} timeUnitInHours - Time interval in hours to filter the price data.
   * @returns {Observable<any[]>} An observable that emits arrays of price data grouped by time intervals.
   * @description The method retrieves price data, filters it based on the provided time interval, and formats the results into nested arrays suitable for time series analysis.
   */
  getTokenData7Days(tokenSymbol: string, timeUnitInHours: number) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    this.logger.log(tokenAddress);
    const tokenPricesPromise = this.databaseService.tokenPriceData.findMany({
      where: {
        tokenAddress,
        periodStartUnix: {
          gte: new Date().getTime() / 1000 - 7 * 24 * 60 * 60, // current time minus 7 days in seconds
        },
      },
    });

    const tokenPricesObservable = from(tokenPricesPromise); // Convert Promise to Observable

    return tokenPricesObservable.pipe(
      map((data) =>
        data.filter((item, _) => {
          const hourIndex = (new Date().getTime() / 3600 / 1000) | 0; // get unique hour within unix history
          const hourStartUnix = hourIndex * 3600; // want the rounded effect

          return (
            (item.periodStartUnix - hourStartUnix) %
              (timeUnitInHours * 3600) ===
            0
          );
        }),
      ),
      map(this.transformDataToNestedArrays),
    );
  }

  /**
   * Transforms an array of raw token price data into a nested array format, separating different price metrics.
   *
   * @param {any[]} data - The array of raw data to transform.
   * @returns {any[][]} A nested array where each sub-array corresponds to a different price metric (open, close, high, low, priceUSD), formatted with timestamps.
   * @description Each sub-array contains tuples of formatted date-time, metric name, and value.
   */
  transformDataToNestedArrays(data: any[]) {
    // Convert UNIX timestamp to readable date-time format
    const convertToReadableDate = (unixTimestamp: number) => {
      const date = new Date(unixTimestamp * 1000);
      return format(date, "yyyy-MM-dd'T'HH:mm:ss");
    };
    // Reformat the data
    const reformattedData = [[], [], [], [], []]; // Arrays for open, close, high, low, priceUSD

    data.forEach((item) => {
      const formattedDate = convertToReadableDate(item.periodStartUnix);
      reformattedData[0].push([formattedDate, 'open', item.open]);
      reformattedData[1].push([formattedDate, 'close', item.close]);
      reformattedData[2].push([formattedDate, 'high', item.high]);
      reformattedData[3].push([formattedDate, 'low', item.low]);
      reformattedData[4].push([formattedDate, 'priceUSD', item.priceUSD]);
    });
    return reformattedData;
  }
}
