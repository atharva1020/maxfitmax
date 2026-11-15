import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BiometricsService, BiometricTargets, DailyTotals } from '../../services/biometrics.service';

@Component({
  selector: 'app-macro-rings',
  templateUrl: './macro-rings.component.html',
  styleUrls: ['./macro-rings.component.css']
})
export class MacroRingsComponent implements OnInit, OnDestroy {
  targets!: BiometricTargets;
  intake!: DailyTotals;

  // Circle properties
  radius = 50;
  circumference = 2 * Math.PI * this.radius;

  private subscriptions = new Subscription();

  constructor(private biometricsService: BiometricsService) {}

  ngOnInit(): void {
    // Combine targets and intakes subscriptions
    this.subscriptions.add(
      this.biometricsService.targets$.subscribe(targets => {
        this.targets = targets;
      })
    );

    this.subscriptions.add(
      this.biometricsService.loggedTotals$.subscribe(intake => {
        this.intake = intake;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Calculate percentage of progress for any macro or calorie
  getPercentage(current: number, target: number): number {
    if (!target) return 0;
    const pct = (current / target) * 100;
    return Math.min(100, Math.max(0, pct)); // Cap at 100% for SVG ring visualization
  }

  // Calculate SVG stroke offset based on progress
  getStrokeOffset(current: number, target: number): number {
    const pct = this.getPercentage(current, target);
    return this.circumference - (pct / 100) * this.circumference;
  }
}
