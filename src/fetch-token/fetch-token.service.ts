import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

/**
 * Service to fetch token data
 * @class
 * @name FetchTokenService
 */
@Injectable()
export class FetchTokenService {
  logger = new Logger(FetchTokenService.name);
  constructor(private readonly databaseService: DatabaseService) {}

  async saveTokenData(tokenData) {
    if (!tokenData || !tokenData.tokenAddress) {
      throw new HttpException('Token data is required', HttpStatus.BAD_REQUEST);
    }
    try {
      // Check if token already exists
      let token = await this.databaseService.token.findUnique({
        where: {
          tokenAddress: tokenData.tokenAddress,
        },
      });

      // If token exists, update token
      if (token) {
        this.logger.log('Token already exists, update token', token);
        token = await this.databaseService.token.update({
          where: {
            tokenAddress: tokenData.tokenAddress,
          },
          data: {
            totalSupply: tokenData.totalSupply,
            volumeUSD: tokenData.volumeUSD,
          },
        });
        return token;
      }

      // If token does not exist, create token
      token = await this.databaseService.token.create({
        data: {
          tokenAddress: tokenData.tokenAddress,
          name: tokenData.name,
          symbol: tokenData.symbol,
          totalSupply: tokenData.totalSupply,
          volumeUSD: tokenData.volumeUSD,
          decimals: tokenData.decimals,
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
    if (!tokenPriceData || !tokenPriceData.tokenAddress) {
      throw new HttpException(
        'Token price data is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Check if token price already exists
      let tokenPrice = await this.databaseService.tokenPriceData.findUnique({
        where: {
          id: tokenPriceData.id,
        },
      });

      // If token price exists, update token price
      if (tokenPrice) {
        this.logger.log(
          'Token price already exists, update token price',
          tokenPrice,
        );
        tokenPrice = await this.databaseService.tokenPriceData.create({
          data: {
            tokenAddress: tokenPriceData.tokenAddress,
            id: tokenPriceData.id,
            open: tokenPriceData.open,
            close: tokenPriceData.close,
            high: tokenPriceData.high,
            low: tokenPriceData.low,
            priceUSD: tokenPriceData.priceUSD,
            periodStartUnix: tokenPriceData.periodStartUnix,
          },
        });
        return tokenPrice;
      }
    } catch (error) {
      this.logger.error('Failed to create token price:', error);
      throw error;
    }
  }
}