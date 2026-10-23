import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from '../environments/environment';

type TelemetryProperties = Readonly<Record<string, string>>;

const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
const attributionStorageKey = 'personal-dev-site-attribution';

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appInsights: ApplicationInsights | null = this.createClient();
  private readonly attribution: TelemetryProperties = this.appInsights ? this.readAttribution() : {};

  constructor() {
    if (!this.appInsights) return;

    try {
      this.appInsights.loadAppInsights();
      this.appInsights.trackPageView({
        name: document.title,
        uri: this.getPageUri(),
        properties: this.attribution
      });
    } catch {
      // Telemetry must never prevent the site from loading.
    }
  }

  trackEvent(name: string, properties: Record<string, string> = {}): void {
    if (!this.appInsights) return;

    this.appInsights.trackEvent({ name }, {
      ...this.attribution,
      ...this.sanitizeProperties(properties)
    });
  }

  private createClient(): ApplicationInsights | null {
    if (!isPlatformBrowser(this.platformId) || !environment.APPLICATION_INSIGHTS_CONNECTION_STRING) {
      return null;
    }

    try {
      return new ApplicationInsights({
        config: {
          connectionString: environment.APPLICATION_INSIGHTS_CONNECTION_STRING,
          disableCookiesUsage: true,
          enableAutoRouteTracking: false,
          enableCorsCorrelation: true,
          correlationHeaderExcludedDomains: ['api.rss2json.com'],
          samplingPercentage: 100
        }
      });
    } catch {
      return null;
    }
  }

  private readAttribution(): TelemetryProperties {
    if (!isPlatformBrowser(this.platformId)) return {};

    const stored = this.readStoredAttribution();
    const current = this.readCurrentAttribution();
    const attribution = { ...stored, ...current };

    if (Object.keys(current).length > 0) {
      try {
        sessionStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
      } catch {
        // Storage can be unavailable in private browsing modes.
      }
    }

    const referrerDomain = this.getReferrerDomain();
    return referrerDomain ? { ...attribution, referrer_domain: referrerDomain } : attribution;
  }

  private readCurrentAttribution(): Record<string, string> {
    const query = new URLSearchParams(window.location.search);
    const attribution: Record<string, string> = {};

    for (const key of attributionKeys) {
      const value = this.sanitizeValue(query.get(key));
      if (value) attribution[key] = value;
    }

    const ref = this.sanitizeValue(query.get('ref'));
    if (!attribution['utm_source'] && ref) attribution['utm_source'] = ref;

    return attribution;
  }

  private readStoredAttribution(): Record<string, string> {
    try {
      const stored = sessionStorage.getItem(attributionStorageKey);
      if (!stored) return {};

      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return {};

      const record = parsed as Record<string, unknown>;
      return attributionKeys.reduce<Record<string, string>>((result, key) => {
        const value = this.sanitizeValue(record[key]);
        if (value) result[key] = value;
        return result;
      }, {});
    } catch {
      return {};
    }
  }

  private getReferrerDomain(): string | undefined {
    if (!document.referrer) return undefined;

    try {
      return new URL(document.referrer).hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }

  private getPageUri(): string {
    return `${window.location.origin}${window.location.pathname}`;
  }

  private sanitizeProperties(properties: Record<string, string>): Record<string, string> {
    return Object.entries(properties).reduce<Record<string, string>>((result, [key, value]) => {
      const sanitized = this.sanitizeValue(value);
      if (sanitized) result[key] = sanitized;
      return result;
    }, {});
  }

  private sanitizeValue(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    const sanitized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 100);
    return sanitized || undefined;
  }
}