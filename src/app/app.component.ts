import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AboutComponent } from './about/about.component';
import { Component } from '@angular/core';
import { AreasComponent } from './areas/areas.component';
import { ExperiencesComponent } from './experiences/experiences.component';
import { ContactComponent } from './contact/contact.component';
import { SkillsComponent } from './skills/skills.component';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { BlogComponent } from './blog/blog.component';

@Component({
  selector: 'app-root',
  imports: [
    NavBarComponent, 
    AboutComponent, 
    AreasComponent, 
    ExperiencesComponent,
    BlogComponent,
    ContactComponent,
    SkillsComponent,
    ChatBubbleComponent
  ],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Szilard Ferencz | Fullstack Engineer';
}
