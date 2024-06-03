import { Test, TestingModule } from '@nestjs/testing';
import { FetchTokenService } from './fetch-token.service';

describe('FetchTokenService', () => {
  let service: FetchTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchTokenService],
    }).compile();

    service = module.get<FetchTokenService>(FetchTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
