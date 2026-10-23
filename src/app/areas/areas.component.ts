import { MatCardModule } from '@angular/material/card';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';
import { Component } from '@angular/core';

@Component({
  selector: 'app-areas',
  imports: [MatCardModule, FloatInOnScrollDirective],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss'
})
export class AreasComponent{
}
