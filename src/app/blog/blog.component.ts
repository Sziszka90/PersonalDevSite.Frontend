import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { catchError, forkJoin, map, of } from 'rxjs';
import { PortfolioModalComponent } from '../portfolio/portfolio-modal/portfolio-modal.component';

interface MediumPost {
  title: string;
  link: string;
  description: string;
  thumbnail: string;
  pubDate: string;
  isPortfolioProject?: boolean;
}

const MEDIUM_PROFILE_URL = 'https://medium.com/@szilard.fer';
const MEDIUM_FEED_URL = 'https://medium.com/feed/@szilard.fer';
const MEDIUM_READER_URL = 'https://r.jina.ai/http://';
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
    this.http.get(this.readerUrl(MEDIUM_FEED_URL), { responseType: 'text' }).subscribe({
      next: feed => {
        const postLinks = [
          PORTFOLIO_POST_URL,
          ...this.extractPostLinks(feed)
        ].filter((link, index, links) => links.indexOf(link) === index);

        forkJoin(postLinks.map(link => this.http.get(this.readerUrl(link), { responseType: 'text' }).pipe(
          map(article => this.parsePost(link, article)),
          catchError(() => of(null))
        ))).subscribe(posts => {
          const validPosts = posts.filter((post): post is MediumPost => post !== null);
          const featured = validPosts.find(post => this.normalizeLink(post.link) === PORTFOLIO_POST_URL) ?? null;
          const recentPosts = validPosts
            .filter(post => this.normalizeLink(post.link) !== PORTFOLIO_POST_URL)
            .slice(0, 3);

          this.featuredPost.set(featured);
          this.posts.set(recentPosts);
          this.feedUnavailable.set(!featured && recentPosts.length === 0);
          this.loading.set(false);
        });
      },
      error: () => {
        this.feedUnavailable.set(true);
        this.loading.set(false);
      },
    });
  }

  private readerUrl(mediumUrl: string): string {
    const sourceUrl = new URL(mediumUrl);
    sourceUrl.searchParams.set('_refresh', Date.now().toString());
    return `${MEDIUM_READER_URL}${sourceUrl.host}${sourceUrl.pathname}${sourceUrl.search}`;
  }

  private extractPostLinks(feed: string): string[] {
    const normalizedFeed = feed.replace(/\s+/g, ' ');
    const links = [...normalizedFeed.matchAll(/https:\/\/medium\.com\/@szilard\.fer\/[\w-]+(?:\?[^\s)\]]*)?/g)]
      .map(match => match[0].split('?')[0]);

    return [...new Set(links)].slice(0, 4);
  }

  private parsePost(link: string, article: string): MediumPost {
    const content = article.split('Markdown Content:')[1] ?? '';
    const title = this.metadataValue(article, 'Title') || this.titleFromUrl(link);
    const thumbnail = [...content.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)]
      .map(match => match[1])
      .find(image => !image.includes('resize:fill:32:32')) ?? '';

    return {
      title,
      link,
      description: this.extractDescription(content),
      thumbnail,
      pubDate: this.metadataValue(article, 'Published Time'),
      isPortfolioProject: this.isPortfolioProject({ title, link })
    };
  }

  private normalizeLink(link: string): string {
    return link.split('?')[0].replace(/\/$/, '');
  }

  private metadataValue(article: string, key: string): string {
    return article.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  }

  private titleFromUrl(link: string): string {
    const slug = link.split('/').pop() ?? '';
    return slug.replace(/-[a-f0-9]{12}$/, '').replace(/-/g, ' ');
  }

  private extractDescription(content: string): string {
    const paragraph = content.split(/\n\s*\n/)
      .map(block => this.stripMarkdown(block))
      .find(block => block.length > 80);

    return paragraph?.slice(0, 280) ?? '';
  }

  private stripMarkdown(value: string): string {
    return value
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\[\]\([^)]*\)/g, '')
      .replace(/[*_`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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