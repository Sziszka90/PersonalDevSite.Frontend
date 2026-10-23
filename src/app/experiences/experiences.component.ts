
import { Component, ChangeDetectionStrategy } from '@angular/core';
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
  
}
