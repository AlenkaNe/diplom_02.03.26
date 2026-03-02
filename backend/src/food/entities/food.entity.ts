import { FoodNutrient } from "./food-nutrient.entity";

export class Food {
    id: number;
    description: string;
    brandOwner?: string;
    brandName?: string;
    ingredients?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: FoodNutrient[];
}
/*[
  {
    "id": 454004,
    "description": "APPLE",
    "brandOwner": "TREECRISP 2 GO",
    "ingredients": "CRISP APPLE.",
    "servingSize": 154,
    "servingSizeUnit": "g",
    "foodNutrients": [
      {
        "id": 1087,
        "name": "Calcium, Ca",
        "amount": 0,
        "unitName": "MG"
      }, ... ]
}]
 */