import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PortfolioModalComponent } from '../portfolio/portfolio-modal/portfolio-modal.component';

interface MediumPost {
  title: string;
  link: string;
  description: string;
  thumbnail: string;
  pubDate: string;
  isPortfolioProject?: boolean;
}

interface MediumFeedItem {
  title: string;
  link: string;
  content: string;
  pubDate: string;
}

interface MediumFeedResponse {
  items: MediumFeedItem[];
}

const MEDIUM_PROFILE_URL = 'https://medium.com/@szilard.fer';
const MEDIUM_FEED_URL = 'https://medium.com/feed/@szilard.fer';
const MEDIUM_FEED_PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';
const PORTFOLIO_POST_URL = 'https://medium.com/@szilard.fer/portfolio-finance-app-660489e9846f';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly matDialog = inject(MatDialog);

  readonly mediumProfileUrl = MEDIUM_PROFILE_URL;
  readonly featuredPost = signal<MediumPost | null>(null);
  readonly posts = signal<MediumPost[]>([]);
  readonly loading = signal(true);
  readonly feedUnavailable = signal(false);

  ngOnInit(): void {
    this.http.get<MediumFeedResponse>(this.feedUrl()).subscribe({
      next: feed => {
        const validPosts = feed.items
          .map(item => this.parseFeedItem(item))
          .filter((post): post is MediumPost => post !== null);
        const featured = validPosts.find(post => this.normalizeLink(post.link) === PORTFOLIO_POST_URL) ?? null;
        const recentPosts = validPosts
          .filter(post => this.normalizeLink(post.link) !== PORTFOLIO_POST_URL)
          .slice(0, 3);

        this.featuredPost.set(featured);
        this.posts.set(recentPosts);
        this.feedUnavailable.set(!featured && recentPosts.length === 0);
        this.loading.set(false);
      },
      error: () => {
        this.feedUnavailable.set(true);
        this.loading.set(false);
      },
    });
  }

  private feedUrl(): string {
    return `${MEDIUM_FEED_PROXY_URL}${encodeURIComponent(MEDIUM_FEED_URL)}`;
  }

  private parseFeedItem(item: MediumFeedItem): MediumPost | null {
    const link = this.normalizeLink(item.link);
    if (!item.title || !link) {
      return null;
    }

    const contentDocument = new DOMParser().parseFromString(item.content, 'text/html');
    const thumbnail = contentDocument.querySelector('img')?.getAttribute('src') ?? '';

    return {
      title: item.title,
      link,
      description: this.extractFeedDescription(contentDocument),
      thumbnail,
      pubDate: item.pubDate,
      isPortfolioProject: this.isPortfolioProject({ title: item.title, link })
    };
  }

  private extractFeedDescription(document: Document): string {
    const paragraph = Array.from(document.querySelectorAll('p'))
      .map(element => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .find(value => value.length > 80);

    return paragraph?.slice(0, 280) ?? '';
  }

  private normalizeLink(link: string): string {
    return link.split('?')[0].replace(/\/$/, '');
  }

  private isPortfolioProject(post: Pick<MediumPost, 'title' | 'link'>): boolean {
    const searchableText = `${post.title} ${post.link}`.toLowerCase();
    return searchableText.includes('finance application')
      || searchableText.includes('financeapp')
      || searchableText.includes('bank transaction')
      || (searchableText.includes('portfolio') && searchableText.includes('project'));
  }

  openPortfolioModal(): void {
    this.matDialog.open(PortfolioModalComponent, {
      data: {},
      width: '480px'
    });
  }
}