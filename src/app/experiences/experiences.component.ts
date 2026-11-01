
import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';

@Component({
  selector: 'app-experiences',
  imports: [MatCardModule, FloatInOnScrollDirective],
  templateUrl: './experiences.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './experiences.component.scss'
})
export class ExperiencesComponent {
  private selectedCard?: HTMLElement;

  selectCard(event: MouseEvent): void {
    this.selectedCard?.classList.remove('selected');
    this.selectedCard = event.currentTarget as HTMLElement;
    this.selectedCard.classList.add('selected');
  }

  @HostListener('document:click', ['$event'])
  clearSelectionOutsideCards(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.experience-item')) return;

    this.selectedCard?.classList.remove('selected');
    this.selectedCard = undefined;
  }
}
