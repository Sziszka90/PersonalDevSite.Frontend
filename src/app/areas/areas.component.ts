import { MatCardModule } from '@angular/material/card';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-areas',
  imports: [MatCardModule, FloatInOnScrollDirective],
  templateUrl: './areas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './areas.component.scss'
})
export class AreasComponent{
}
