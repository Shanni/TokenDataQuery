import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':tokenSymbol')
  getToken(@Param('tokenSymbol') tokenSymbol: string) {
    return this.tokenService.getToken(tokenSymbol);
  }

  @Get(':tokenSymbol/data')
  getTokenDataInDays(
    @Param('tokenSymbol') tokenSymbol: string,
    @Query('timeUnit') timeUnitInHours: number,
  ) {
    return this.tokenService.getTokenData7Days(tokenSymbol, timeUnitInHours);
  }
}
