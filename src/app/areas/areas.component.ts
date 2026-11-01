import { MatCardModule } from '@angular/material/card';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';
import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';

@Component({
  selector: 'app-areas',
  imports: [MatCardModule, FloatInOnScrollDirective],
  templateUrl: './areas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './areas.component.scss'
})
export class AreasComponent{
  private selectedCard?: HTMLElement;

  selectCard(event: MouseEvent): void {
    this.selectedCard?.classList.remove('selected');
    this.selectedCard = event.currentTarget as HTMLElement;
    this.selectedCard.classList.add('selected');
  }

  @HostListener('document:click', ['$event'])
  clearSelectionOutsideCards(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.grid-container .card')) return;

    this.selectedCard?.classList.remove('selected');
    this.selectedCard = undefined;
  }
}
