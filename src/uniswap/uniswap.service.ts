import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as rx from 'rxjs';

enum TokenAddresses {
  WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  SHIB = '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
  GNO = '0x6810e776880c02933d47db1b9fc05908e5386b96',
}

@Injectable()
export class UniswapService {
  logger = new Logger('UniswapService');

  endpointUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

  constructor(private httpService: HttpService) {} // ,
  // private databaseService: DatabaseService, // private configService: ConfigService,

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

    this.logger.log(`fetchToken: ${JSON.stringify(body)}`);
    try {
      const res = await rx.lastValueFrom(
        this.httpService
          .post(this.endpointUrl, body)
          .pipe(rx.map((response) => response.data)),
      );
      this.logger.log(`fetchToken Response: ${JSON.stringify(res)}`);
      return res;
    } catch (err) {
      //   this.logger.log(
      //     `createAccount Error: ${JSON.stringify(
      //       (err as AxiosError)?.response?.data,
      //     )}`,
      //   );
      //   const responseBody = {
      //     error: 'NorthCapital Error',
      //     detail: (err as AxiosError)?.response?.data,
      //   };
      //   return response
      //     .status((err as AxiosError)?.response?.status || 500)
      //     .json(responseBody);
    }

    //     const body = {
    //       query,
    //       variables: {
    //         // tokenAddress: tokenAddress.toLowerCase(),
    //       },
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //     };
    //     // await this.databaseService.token.create({
    //     //   data: {
    //     //     name: 'test',
    //     //     symbol: 'test',
    //     //     totalSupply: 0,
    //     //     volumeUSD: 0,
    //     //     decimals: 18,
    //     //     tokenAddress: tokenAddress.toLowerCase(),
    //     //   },
    //     // });
    //     return this.httpService
    //       .post(this.endpointUrl, { ...body } as any)
    //       .toPromise()
    //       .then((response) => response.data);
  }
}
