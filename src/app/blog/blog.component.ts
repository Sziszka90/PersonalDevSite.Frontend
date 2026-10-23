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

const MEDIUM_PROFILE_URL = 'https://medium.com/@szilard.fer';
const MEDIUM_FEED_URL = 'https://medium.com/feed/@szilard.fer';
const MEDIUM_FEED_PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';
const PORTFOLIO_POST_URL = 'https://medium.com/@szilard.fer/portfolio-finance-app-660489e9846f';
const PORTFOLIO_POST_THUMBNAIL = 'https://miro.medium.com/v2/resize:fit:1600/format:webp/1*PQiEV_hs9OOx4n3BFGgmDw.jpeg';
const AI_ASSISTANT_POST_THUMBNAIL = 'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*BMcBvxWNPwGDCa_YfI-ZWw.jpeg';
const FALLBACK_FEATURED_POST: MediumPost = {
  title: 'Building a Full-Stack Finance Application with .NET, Angular, Azure and AI',
  link: PORTFOLIO_POST_URL,
  description: 'A full-stack finance application covering architecture, security, AI integration, and cloud deployment.',
  thumbnail: PORTFOLIO_POST_THUMBNAIL,
  pubDate: '2026-08-04T00:00:00Z'
};
const FALLBACK_RECENT_POSTS: MediumPost[] = [{
  title: 'Building a Personal AI Assistant with RAG, Azure AI Search, and Azure OpenAI',
  link: 'https://medium.com/@szilard.fer/building-a-personal-ai-assistant-with-rag-azure-ai-search-and-azure-openai-42874f903dcb',
  description: 'How a personal AI assistant uses RAG, hybrid search, Azure AI Search, and streaming responses.',
  thumbnail: AI_ASSISTANT_POST_THUMBNAIL,
  pubDate: '2026-08-04T00:00:00Z'
}];

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
  readonly featuredPost = signal<MediumPost | null>(FALLBACK_FEATURED_POST);
  readonly posts = signal<MediumPost[]>(FALLBACK_RECENT_POSTS);

  ngOnInit(): void {
    this.http.get<MediumFeedResponse>(this.feedUrl()).subscribe({
      next: feed => {
        if (!Array.isArray(feed.items)) return;

        const validPosts = feed.items
          .map(item => this.parseFeedItem(item))
          .filter((post): post is MediumPost => post !== null);
        if (validPosts.length === 0) return;

        const featured = validPosts.find(post => this.normalizeLink(post.link) === PORTFOLIO_POST_URL)
          ?? FALLBACK_FEATURED_POST;
        const recentPosts = validPosts
          .filter(post => this.normalizeLink(post.link) !== PORTFOLIO_POST_URL)
          .slice(0, 3);

        this.featuredPost.set(featured);
        this.posts.set(recentPosts.length > 0 ? recentPosts : FALLBACK_RECENT_POSTS);
      },
      error: () => { /* Keep the published posts visible when the feed proxy is unavailable. */ }
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
