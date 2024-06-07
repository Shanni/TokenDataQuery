import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { UniswapService } from './uniswap.service';
import { TokenService } from 'src/token/token.service';
import { HttpException } from '@nestjs/common';

describe('UniswapService', () => {
  let service: UniswapService;
  let httpService: HttpService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            saveTokenPriceData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UniswapService>(UniswapService);
    httpService = module.get<HttpService>(HttpService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(httpService).toBeDefined();
    expect(tokenService).toBeDefined();
  });

  describe('fetchToken', () => {
    it('should fetch token data successfully', async () => {
      const result = {
        data: {
          token: {
            id: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            name: 'Wrapped BTC',
            symbol: 'WBTC',
            totalSupply: 18240,
            volumeUSD: 120242943725.3597,
            decimals: 8,
          },
        },
      };
      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() => of(result as any));

      expect(await service.fetchToken('ETH')).toEqual(result);
      expect(httpService.post).toHaveBeenCalledWith(
        service.endpointUrl,
        expect.any(Object),
      );
    });

    it('should throw an error if the token is not supported', async () => {
      await expect(service.fetchToken('XYZ')).rejects.toThrow(HttpException);
    });

    it('should handle HTTP errors', async () => {
      const error = { response: { data: 'Error', status: 500 } };
      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() => throwError(() => error));

      await expect(service.fetchToken('ETH')).rejects.toThrow(HttpException);
    });
  });

  describe('fetchTokenDataWithTime', () => {
    it('should fetch token hourly data successfully', async () => {
      const result = {
        data: {
          tokenHourData: {
            open: '69122.4158688238885189394161009568',
            close: '69150.45791684267592063705874315452',
            high: '69150.70817304336931066707918587047',
            low: '69122.4158688238885189394161009568',
            priceUSD: '69150.45791684267592063705874315452',
          },
        },
      };
      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() => of(result as any));

      const testDate = new Date('2021-01-01');
      expect(await service.fetchTokenDataWithTime('ETH', testDate)).toEqual(
        result,
      );
      expect(httpService.post).toHaveBeenCalledWith(
        service.endpointUrl,
        expect.any(Object),
      );
    });

    it('should handle HTTP errors during data fetching', async () => {
      const error = { response: { data: 'Error', status: 500 } };
      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() => throwError(() => error));

      const testDate = new Date('2021-01-01');
      await expect(
        service.fetchTokenDataWithTime('ETH', testDate),
      ).rejects.toThrow(HttpException);
    });
  });
});
