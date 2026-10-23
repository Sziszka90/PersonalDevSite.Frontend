
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';

@Component({
  selector: 'app-experiences',
  imports: [MatCardModule, FloatInOnScrollDirective],
  templateUrl: './experiences.component.html',
  styleUrl: './experiences.component.scss'
})
export class ExperiencesComponent {
  
}
