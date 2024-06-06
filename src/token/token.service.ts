import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { TokenAddresses } from 'src/token/token.enum';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { format } from 'date-fns';
/**
 * Service to save token data and save token price data
 * @class
 * @name FetchTokenService
 */
@Injectable()
export class TokenService {
  logger = new Logger(TokenService.name);
  constructor(private readonly databaseService: DatabaseService) {}

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

  getToken(tokenSymbol: string) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    return this.databaseService.token.findUnique({
      where: {
        tokenAddress,
      },
    });
  }

  getTokenData7Days(tokenSymbol: string, timeUnitInHours: number) {
    const tokenAddress =
      TokenAddresses[tokenSymbol as keyof typeof TokenAddresses];
    this.logger.log(tokenAddress);
    const tokenPricesPromise = this.databaseService.tokenPriceData.findMany({
      where: {
        tokenAddress,
        periodStartUnix: {
          gte: new Date().getTime() / 1000 - 7 * 24 * 60 * 60,
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
