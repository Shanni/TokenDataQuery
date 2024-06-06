import { Controller, Get, Param } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':tokenSymbol')
  getToken(@Param('tokenSymbol') tokenSymbol: string) {
    return this.tokenService.getToken(tokenSymbol);
  }

  @Get(':tokenSymbol/interval/:intervalInDays')
  getTokenDataInDays(
    @Param('tokenSymbol') tokenSymbol: string,
    @Param('intervalInDays') intervalInDays: number,
  ) {
    return this.tokenService.getTokenData(tokenSymbol, intervalInDays);
  }
}
