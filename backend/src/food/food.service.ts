// food.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Food } from './entities/food.entity';
import { FoodSearchDto } from './entities/food-search.dto';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FoodService {
  private readonly apiUrl = 'https://api.nal.usda.gov/fdc/v1';
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('FOOD_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('FOOD_DATA_API_KEY не найден в переменных окружения');
    }
    this.apiKey = apiKey;
  }

  async searchFood(searchDto: FoodSearchDto): Promise<Food[]> {
    const params = {
      query: searchDto.query,
      pageSize: searchDto.pageSize || 25,
      pageNumber: searchDto.pageNumber || 1,
      api_key: this.apiKey,
    };

    const { data } = await firstValueFrom(
      this.httpService.get(`${this.apiUrl}/foods/search`, { params })
    );
    
    return data.foods.map(food => this.mapToFoodEntity(food));
  }

  private mapToFoodEntity(foodData: any): Food {
    const food = new Food();
    food.id = foodData.fdcId;
    food.description = foodData.description;
    food.brandOwner = foodData.brandOwner;
    food.brandName = foodData.brandName;
    food.ingredients = foodData.ingredients;
    food.servingSize = foodData.servingSize;
    food.servingSizeUnit = foodData.servingSizeUnit;
    
    if (foodData.foodNutrients) {
      food.foodNutrients = foodData.foodNutrients.map(nutrient => ({
        id: nutrient.nutrientId,
        name: nutrient.nutrientName,
        amount: nutrient.value,
        unitName: nutrient.unitName,
      }));
    }
    
    return food;
  }
}