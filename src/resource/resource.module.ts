import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'ASYNC_CONNECTION',
      useFactory: async () => {
        console.log('Setting up resources...');
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Resources Ready..');
        return 'Resource Ready';
      },
    },
  ],
  exports: ['ASYNC_CONNECTION'],
})
export class ResourceModule {}
