import { Component, OnInit } from '@angular/core';
import { TypingAnimationDirective } from '../../directives/typewriter/typing-animation.directive';
import { FloatInOnScrollDirective } from '../directives/float-in.directive';

import { interval } from 'rxjs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TypingAnimationDirective, FloatInOnScrollDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  start: boolean = false;

  showLearn = false;
  showBuild = false;
  showDeploy = false;
  showDone = false;

  // Controls disabled state of the CV download button
  cvDisabled = false;

  ngOnInit() {
    interval(5000).subscribe(() => this.start = !this.start);
    this.startAnimationFlow();
  }

  startAnimationFlow() {
    this.showLearn = true;
    this.showBuild = false;
    this.showDeploy = false;
    this.showDone = false;
    setTimeout(() => {
      this.showLearn = false;
      this.showBuild = true;
      setTimeout(() => {
        this.showBuild = false;
        this.showDeploy = true;
        setTimeout(() => {
          this.showDeploy = false;
          this.showDone = true;
          setTimeout(() => {
            this.showDone = false;
            this.startAnimationFlow();
          }, 3000);
        }, 2500);
      }, 2500);
    }, 2500);
  }

  downloadCv() {
    if (this.cvDisabled) return;
    this.cvDisabled = true;
    try {
      const link = document.createElement('a');
      link.href = 'assets/Ferencz_Szilard_CV.pdf';
      link.download = 'SzilardFerencz-CV';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      // Small delay for UI feedback; adjust or remove as desired
      setTimeout(() => { this.cvDisabled = false; }, 500);
    }
  }
}
