import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FetchTokenController } from './fetch-token/fetch-token.controller';
import { UniswapService } from './uniswap/uniswap.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AppController, FetchTokenController],
  providers: [AppService, UniswapService],
})
export class AppModule {}
