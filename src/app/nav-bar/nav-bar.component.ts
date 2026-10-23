import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Offcanvas } from 'bootstrap';
import { GetInTouchComponent } from '../get-in-touch/get-in-touch.component';

@Component({
  selector: 'app-nav-bar',
  imports: [GetInTouchComponent],
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements AfterViewInit, OnDestroy {
  private offcanvasElementInfo!: HTMLElement;
  private offcanvasInstanceInfo!: Offcanvas;

  private offcanvasElementMenu!: HTMLElement;
  private offcanvasInstanceMenu!: Offcanvas;
  private sectionObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.offcanvasElementInfo = document.getElementById('offcanvasInfo')!;
    this.offcanvasInstanceInfo = new Offcanvas(this.offcanvasElementInfo);

    this.offcanvasElementMenu = document.getElementById('offcanvasMenu')!;
    this.offcanvasInstanceMenu = new Offcanvas(this.offcanvasElementMenu);

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(
      '.navbar-menu a[href^="#"], .offcanvas-menu a[href^="#"]'
    ));
    const sections = links
      .map(link => document.getElementById(link.hash.slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    this.sectionObserver = new IntersectionObserver(entries => {
      const activeSection = entries
        .filter(entry => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]?.target as HTMLElement | undefined;

      if (!activeSection) return;

      links.forEach(link => {
        const isActive = link.hash === `#${activeSection.id}`;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });

    sections.forEach(section => this.sectionObserver?.observe(section));
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  openOffcanvas(): void {
    this.offcanvasInstanceInfo.show();
    this.offcanvasInstanceMenu.show();
  }

  closeOffcanvas(): void {
    this.offcanvasInstanceInfo.hide();
    this.offcanvasInstanceMenu.hide();
  }
}
