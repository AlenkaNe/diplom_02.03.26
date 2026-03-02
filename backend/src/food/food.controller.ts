// food.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { FoodService } from './food.service';
import { Food } from './entities/food.entity';
import { FoodSearchDto } from './entities/food-search.dto';

@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('search')
  async searchFood(@Query() searchDto: FoodSearchDto): Promise<Food[]> {
    return this.foodService.searchFood(searchDto);
  }
}