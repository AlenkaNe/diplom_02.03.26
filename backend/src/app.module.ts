import { Module } from '@nestjs/common';
import { FoodController } from './food/food.controller';
import { FoodService } from './food/food.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [FoodController],
  providers: [FoodService],
})
export class AppModule {}
