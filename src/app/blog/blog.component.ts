import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PortfolioModalComponent } from '../portfolio/portfolio-modal/portfolio-modal.component';
import { environment } from '../../environments/environment';

interface MediumPost {
  title: string;
  link: string;
  description: string;
  thumbnail: string;
  pubDate: string;
}

interface MediumFeedItem {
  title: string;
  link: string;
  content?: string;
  description?: string;
  thumbnail?: string;
  pubDate: string;
}

interface MediumFeedResponse {
  items?: MediumFeedItem[];
}

interface CachedBlogFeed {
  fetchedAt: number;
  featuredPost: MediumPost | null;
  posts: MediumPost[];
}

const MEDIUM_PROFILE_URL = 'https://medium.com/@szilard.fer';
const MEDIUM_FEED_CACHE_KEY = 'personal-dev-site.blog-feed.v1';
const MEDIUM_FEED_CACHE_TTL_MS = 5 * 60 * 1000;
const PORTFOLIO_POST_URL = 'https://medium.com/@szilard.fer/portfolio-finance-app-660489e9846f';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './blog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly matDialog = inject(MatDialog);

  readonly mediumProfileUrl = MEDIUM_PROFILE_URL;
  readonly featuredPost = signal<MediumPost | null>(null);
  readonly posts = signal<MediumPost[]>([]);

  ngOnInit(): void {
    const cachedFeed = this.readCachedFeed();
    if (cachedFeed) {
      this.setFeed(cachedFeed);
      if (Date.now() - cachedFeed.fetchedAt < MEDIUM_FEED_CACHE_TTL_MS) {
        return;
      }
    }

    this.http.get<MediumFeedResponse>(this.feedUrl()).subscribe({
      next: feed => {
        if (!Array.isArray(feed.items)) {
          return;
        }

        const validPosts = feed.items
          .map(item => this.parseFeedItem(item))
          .filter((post): post is MediumPost => post !== null);
        const featured = validPosts.find(post => this.normalizeLink(post.link) === PORTFOLIO_POST_URL) ?? null;
        const recentPosts = validPosts
          .filter(post => this.normalizeLink(post.link) !== PORTFOLIO_POST_URL)
          .slice(0, 3);
        const updatedFeed: CachedBlogFeed = {
          fetchedAt: Date.now(),
          featuredPost: featured,
          posts: recentPosts
        };

        this.setFeed(updatedFeed);
        this.writeCachedFeed(updatedFeed);
      },
      error: () => {
        if (!cachedFeed) {
          this.featuredPost.set(null);
          this.posts.set([]);
        }
      }
    });
  }

  private feedUrl(): string {
    const url = new URL(environment.API_URL);
    url.pathname = url.pathname.replace(/\/LLMProcessorFunction\/?$/, '/MediumFeedFunction');
    url.search = '';
    return url.toString();
  }

  private readCachedFeed(): CachedBlogFeed | null {
    try {
      const value = localStorage.getItem(MEDIUM_FEED_CACHE_KEY);
      if (!value) {
        return null;
      }

      const cachedFeed: unknown = JSON.parse(value);
      return this.isCachedFeed(cachedFeed) ? cachedFeed : null;
    } catch {
      return null;
    }
  }

  private writeCachedFeed(feed: CachedBlogFeed): void {
    try {
      localStorage.setItem(MEDIUM_FEED_CACHE_KEY, JSON.stringify(feed));
    } catch {
      // Blog posts still work when browser storage is disabled or full.
    }
  }

  private isCachedFeed(value: unknown): value is CachedBlogFeed {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const feed = value as Partial<CachedBlogFeed>;
    return typeof feed.fetchedAt === 'number'
      && (feed.featuredPost === null || this.isMediumPost(feed.featuredPost))
      && Array.isArray(feed.posts)
      && feed.posts.every(post => this.isMediumPost(post));
  }

  private isMediumPost(value: unknown): value is MediumPost {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const post = value as Partial<MediumPost>;
    return typeof post.title === 'string'
      && typeof post.link === 'string'
      && typeof post.description === 'string'
      && typeof post.thumbnail === 'string'
      && typeof post.pubDate === 'string';
  }

  private setFeed(feed: CachedBlogFeed): void {
    this.featuredPost.set(feed.featuredPost);
    this.posts.set(feed.posts);
  }

  private parseFeedItem(item: MediumFeedItem): MediumPost | null {
    const link = this.normalizeLink(item.link);
    if (!item.title || !link) {
      return null;
    }

    const contentDocument = new DOMParser().parseFromString(item.content ?? item.description ?? '', 'text/html');
    const thumbnail = item.thumbnail || contentDocument.querySelector('img')?.getAttribute('src') || '';

    return {
      title: item.title,
      link,
      description: this.extractFeedDescription(contentDocument),
      thumbnail,
      pubDate: item.pubDate
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

  openPortfolioModal(): void {
    this.matDialog.open(PortfolioModalComponent, {
      data: {},
      width: '480px',
      panelClass: 'portfolio-modal-panel'
    });
  }
}
