export class FoodSearchDto {
    query: string;
    pageSize?: number;
    pageNumber?: number;
}
//http://localhost:3000/foods/search?query=apple&pageSize=10&pageNumber=1