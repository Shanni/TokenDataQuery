import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { DatabaseService } from 'src/database/database.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';

describe('TokenService', () => {
  let service: TokenService;
  let dbServiceMock: MockProxy<DatabaseService>;

  beforeEach(async () => {
    dbServiceMock = mock<DatabaseService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: DatabaseService, useValue: dbServiceMock },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTokenData', () => {
    const tokenData = {
      id: '0x123',
      name: 'TestToken',
      symbol: 'TT',
      totalSupply: '1000',
      volumeUSD: '10000',
      decimals: 18,
    };

    it('should throw HttpException if tokenData is null', async () => {
      await expect(service.saveTokenData(null)).rejects.toThrow(
        new HttpException('Token data is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should create a new token if it does not exist', async () => {
      dbServiceMock.token.findUnique.mockResolvedValue(null);
      dbServiceMock.token.create.mockResolvedValue(tokenData);

      const result = await service.saveTokenData(tokenData);

      expect(dbServiceMock.token.create).toHaveBeenCalledWith({
        data: {
          tokenAddress: tokenData.id,
          name: tokenData.name,
          symbol: tokenData.symbol,
          totalSupply: +tokenData.totalSupply,
          volumeUSD: +tokenData.volumeUSD,
          decimals: +tokenData.decimals,
        },
      });
      expect(result).toEqual(tokenData);
    });

    it('should update an existing token', async () => {
      dbServiceMock.token.findUnique.mockResolvedValue(tokenData);
      dbServiceMock.token.update.mockResolvedValue({
        ...tokenData,
        volumeUSD: '20000',
      });

      const updatedData = { ...tokenData, volumeUSD: '20000' };
      const result = await service.saveTokenData(tokenData);

      expect(dbServiceMock.token.update).toHaveBeenCalledWith({
        where: { tokenAddress: tokenData.id },
        data: {
          totalSupply: +tokenData.totalSupply,
          volumeUSD: +tokenData.volumeUSD,
        },
      });
      expect(result).toEqual(updatedData);
    });
  });

  describe('getToken', () => {
    it('should retrieve token data by symbol', async () => {
      const tokenAddress = '0x123';
      const tokenData = { id: tokenAddress, name: 'TestToken', symbol: 'TT' };
      dbServiceMock.token.findUnique.mockResolvedValue(tokenData);

      const result = await service.getToken('TT');

      expect(dbServiceMock.token.findUnique).toHaveBeenCalledWith({
        where: { tokenAddress },
      });
      expect(result).toEqual(tokenData);
    });

    it('should return null if no token is found', async () => {
      dbServiceMock.token.findUnique.mockResolvedValue(null);

      const result = await service.getToken('TT');

      expect(result).toBeNull();
    });
  });
});
