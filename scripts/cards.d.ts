export interface Ingredient {
  id: string;
  name: string;
  value: number;
  getDesc: () => string;
}
export const allCardDataBase: Ingredient[];

export class UniqCard {
  id: Ingredient["id"];
  status: string;
  constructor(ingredientId: Ingredient["id"]);

  getName: () => string;
  getDesc: () => string;
}
