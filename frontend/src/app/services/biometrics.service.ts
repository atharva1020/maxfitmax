import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MacroSplit {
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface BiometricTargets {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  macros: MacroSplit;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricsService {
  // Global targets BehaviorSubject
  private targetsSubject = new BehaviorSubject<BiometricTargets>({
    bmr: 1805,
    tdee: 2798,
    dailyCalories: 2298,
    macros: { proteinGrams: 176, carbsGrams: 254, fatsGrams: 64 }
  });
  public targets$: Observable<BiometricTargets> = this.targetsSubject.asObservable();

  // Logged totals for the current day BehaviorSubject
  private loggedTotalsSubject = new BehaviorSubject<DailyTotals>({
    calories: 1250,
    protein: 95,
    carbs: 140,
    fats: 35
  });
  public loggedTotals$: Observable<DailyTotals> = this.loggedTotalsSubject.asObservable();

  // Water intake BehaviorSubject (in mL)
  private waterIntakeSubject = new BehaviorSubject<number>(1200);
  public waterIntake$: Observable<number> = this.waterIntakeSubject.asObservable();

  constructor() {}

  // Update biometric targets (e.g. from onboarding)
  updateTargets(newTargets: BiometricTargets): void {
    this.targetsSubject.next(newTargets);
  }

  // Update logged intake totals (from logging meals or importing from vault)
  logNutrition(calories: number, protein: number, carbs: number, fats: number): void {
    const current = this.loggedTotalsSubject.value;
    this.loggedTotalsSubject.next({
      calories: Math.max(0, current.calories + calories),
      protein: Math.max(0, current.protein + protein),
      carbs: Math.max(0, current.carbs + carbs),
      fats: Math.max(0, current.fats + fats)
    });
  }

  // Log water intake
  logWater(amountMl: number): void {
    const current = this.waterIntakeSubject.value;
    this.waterIntakeSubject.next(Math.max(0, current + amountMl));
  }

  // Reset daily stats (for new day scheduling)
  resetDailyStats(): void {
    this.loggedTotalsSubject.next({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    this.waterIntakeSubject.next(0);
  }

  // Get current snapshot values
  getCurrentTargets(): BiometricTargets {
    return this.targetsSubject.value;
  }

  getCurrentIntake(): DailyTotals {
    return this.loggedTotalsSubject.value;
  }
}
