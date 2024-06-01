import { Controller, Get, Param } from '@nestjs/common';
import { UniswapService } from 'src/uniswap/uniswap.service';

@Controller('token')
export class FetchTokenController {
  constructor(private readonly uniswapService: UniswapService) {}

  @Get(':tokenSymbol')
  getToken(@Param('tokenSymbol') tokenSymbol: string) {
    return this.uniswapService.fetchToken(tokenSymbol);
  }
}
