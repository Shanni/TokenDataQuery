import { Test, TestingModule } from '@nestjs/testing';
import { FetchTokenController } from './fetch-token.controller';

describe('FetchTokenController', () => {
  let controller: FetchTokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchTokenController],
    }).compile();

    controller = module.get<FetchTokenController>(FetchTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
