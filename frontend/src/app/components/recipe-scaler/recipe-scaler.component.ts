import { Component, Input, OnInit } from '@angular/core';

export interface Ingredient {
  name: string;
  rawQuantityGrams: number;
  displayUnit: string;
}

export interface Recipe {
  title: string;
  baseYieldServings: number;
  calculatedFinalMacros: {
    totalCookedWeightGrams: number;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatsPerServing: number;
  };
  ingredients: Ingredient[];
}

@Component({
  selector: 'app-recipe-scaler',
  templateUrl: './recipe-scaler.component.html',
  styleUrls: ['./recipe-scaler.component.css']
})
export class RecipeScalerComponent implements OnInit {
  @Input() recipe: Recipe = {
    title: 'High Protein Garlic Butter Chicken Rice',
    baseYieldServings: 2,
    calculatedFinalMacros: {
      totalCookedWeightGrams: 800,
      caloriesPerServing: 550,
      proteinPerServing: 45,
      carbsPerServing: 65,
      fatsPerServing: 12
    },
    ingredients: [
      { name: 'Chicken Breast (Raw)', rawQuantityGrams: 400, displayUnit: 'g' },
      { name: 'White Rice (Raw)', rawQuantityGrams: 150, displayUnit: 'g' },
      { name: 'Olive Oil', rawQuantityGrams: 10, displayUnit: 'g' },
      { name: 'Garlic Cloves', rawQuantityGrams: 15, displayUnit: 'g' }
    ]
  };

  // Two-way bound scaling fields
  targetCookedWeight!: number;
  scaleMultiplier: number = 1.0;

  ngOnInit(): void {
    if (this.recipe) {
      this.targetCookedWeight = this.recipe.calculatedFinalMacros.totalCookedWeightGrams;
    }
  }

  // Called whenever the user alters the target weight input
  onTargetWeightChange(): void {
    const baseWeight = this.recipe.calculatedFinalMacros.totalCookedWeightGrams;
    if (baseWeight && this.targetCookedWeight > 0) {
      // Calculate new multiplier based on yield targets
      this.scaleMultiplier = this.targetCookedWeight / baseWeight;
    } else {
      this.scaleMultiplier = 1.0;
    }
  }

  // Called to update from servings multiplier inputs
  updateByServings(servings: number): void {
    const baseServings = this.recipe.baseYieldServings;
    if (baseServings && servings > 0) {
      this.scaleMultiplier = servings / baseServings;
      this.targetCookedWeight = Math.round(this.recipe.calculatedFinalMacros.totalCookedWeightGrams * this.scaleMultiplier);
    }
  }
}
