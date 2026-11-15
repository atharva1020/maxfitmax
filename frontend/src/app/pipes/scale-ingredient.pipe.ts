import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scaleIngredient'
})
export class ScaleIngredientPipe implements PipeTransform {
  /**
   * Scales a raw ingredient amount by a target weight multiplier.
   * 
   * @param value - The base ingredient amount (grams or units)
   * @param multiplier - The scale multiplier input
   * @returns Scaled numeric value formatted to 1 decimal place
   */
  transform(value: number, multiplier: number): number {
    if (!value || isNaN(value)) return 0;
    const scaled = value * (multiplier || 1.0);
    return Math.round(scaled * 10) / 10; // Round to 1 decimal place
  }
}
