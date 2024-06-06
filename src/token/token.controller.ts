import { Controller, Get, Param } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':tokenSymbol')
  getToken(@Param('tokenSymbol') tokenSymbol: string) {
    return this.tokenService.getToken(tokenSymbol);
  }

  @Get(':tokenSymbol/interval/:timeUnitInHours')
  getTokenDataInDays(
    @Param('tokenSymbol') tokenSymbol: string,
    @Param('timeUnitInHours') timeUnitInHours: number,
  ) {
    return this.tokenService.getTokenData7Days(tokenSymbol, timeUnitInHours);
  }
}
