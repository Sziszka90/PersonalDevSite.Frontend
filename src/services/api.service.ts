import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  post<Conversation>(body: Conversation): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}`, body);
  }

  async streamChat(message: string, onDelta: (delta: string) => void): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Chat request failed with status ${response.status}`);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';

      for (const event of events) {
        if (this.handleStreamEvent(event, onDelta)) return;
      }
    }

    if (buffer.trim()) {
      this.handleStreamEvent(buffer, onDelta);
    }
  }

  private handleStreamEvent(event: string, onDelta: (delta: string) => void): boolean {
    const lines = event.split(/\r?\n/);
    const eventType = lines.find(line => line.startsWith('event:'))?.slice(6).trim();

    if (eventType === 'done') return true;

    const data = lines
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n');

    if (!data || data === '[DONE]') return data === '[DONE]';

    const parsed: { delta?: unknown } = JSON.parse(data);
    if (typeof parsed.delta === 'string') {
      onDelta(parsed.delta);
    }

    return false;
  }
}
