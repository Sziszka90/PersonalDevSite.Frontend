import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skills',
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss'
})
export class SkillsComponent {

  positionedSkills = [
    { name: '.NET', img: 'assets/NET core.png' },
    { name: 'Angular', img: 'assets/Angular.png' },
    { name: 'VisualStudio', img: 'assets/Visual Studio.png' },
    { name: 'Azure', img: 'assets/Azure.png' },
    { name: 'MSSQL', img: 'assets/Microsoft SQL Server.png' },
    { name: 'Oracle', img: 'assets/Oracle.png' },
    { name: 'RabbitMQ', img: 'assets/RabbitMQ.png' },
    { name: 'Docker', img: 'assets/Docker.png' },
    { name: 'Kubernetes', img: 'assets/Kubernetes.png' },
    { name: 'Helm', img: 'assets/Helm.png' },
    { name: 'GitHub', img: 'assets/GitHub.png' },

  ];
}
