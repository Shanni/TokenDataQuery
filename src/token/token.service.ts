import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { connect } from 'http2';
import { DatabaseService } from 'src/database/database.service';

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

  getToken(tokenAddress: string) {
    return this.databaseService.token.findUnique({
      where: {
        tokenAddress,
      },
    });
  }
}
