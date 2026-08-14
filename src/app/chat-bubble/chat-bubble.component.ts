import { Component, inject, ViewChild, ElementRef, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/conversation.dto';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  imports: [
    CommonModule,
    FormsModule
  ],
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent {
  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;
  @ViewChild('chatBubble') chatBubble!: ElementRef<HTMLDivElement>;
  apiService = inject(ApiService);
  message = '';
  response = '';
  loading = signal(false);
  showBubble = false;
  messages = signal<{ text: string, sender: 'user' | 'assistant' }[]>([
    { text: 'Hi! Welcome to my personal website. Feel free to ask me anything about my experience, skills, or projects!', sender: 'assistant' }
  ]);
  private conversationHistory: ChatMessage[] = [];
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragging = false;
  bubblePosition = { top: 100, right: 32 };
  touchStartX = 0;
  touchStartY = 0;
  touchMoved = false;
  suppressClick = false;
  pointerId: number | null = null;

  private _handleDocumentClick!: (e: MouseEvent) => void;
  private _pointerMoveHandler!: (e: PointerEvent) => void;
  private _pointerUpHandler!: (e: PointerEvent) => void;

  constructor() {
    this._handleDocumentClick = this.handleDocumentClick.bind(this);
    this._pointerMoveHandler = this.onDragMove.bind(this);
    this._pointerUpHandler = this.onPointerEnd.bind(this);

    document.addEventListener('click', this._handleDocumentClick);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this._handleDocumentClick);
    this.onDragEnd();
  }

  handleDocumentClick(event: MouseEvent) {
    if (this.showBubble && this.chatBubble && !this.chatBubble.nativeElement.contains(event.target as Node)) {
      this.showBubble = false;
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    }, 0);
  }

  private scrollToResponseTop() {
    setTimeout(() => {
      if (!this.chatBody) return;

      const assistantMessages = this.chatBody.nativeElement.querySelectorAll('.chat-message.assistant');
      const latestAssistantMessage = assistantMessages[assistantMessages.length - 1] as HTMLElement | undefined;
      if (latestAssistantMessage) {
        this.chatBody.nativeElement.scrollTop = latestAssistantMessage.offsetTop - 8;
      }
    }, 0);
  }

  sendMessage() {
    if (!this.message.trim() || this.loading()) return;
    const msgToSend = this.message;
    const history = [...this.conversationHistory];
    this.message = '';
    this.loading.set(true);
    this.messages.update(messages => [
      ...messages,
      { text: msgToSend, sender: 'user' }
    ]);
    this.scrollToBottom();

    let assistantText = '';
    let responseTopShown = false;
    this.apiService.streamChat(msgToSend, history, delta => {
      assistantText += delta;
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage?.sender === 'assistant') {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + delta
          };
        } else {
          updatedMessages.push({ text: delta, sender: 'assistant' });
        }
        return updatedMessages;
      });
      if (!responseTopShown) {
        responseTopShown = true;
        this.scrollToResponseTop();
      }
    }).then(() => {
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage?.sender !== 'assistant') {
          updatedMessages.push({ text: 'No response', sender: 'assistant' });
        }
        return updatedMessages;
      });
      this.conversationHistory = [
        ...history,
        { role: 'user', content: msgToSend },
        { role: 'assistant', content: assistantText || 'No response' }
      ];
      this.loading.set(false);
      if (!responseTopShown) this.scrollToResponseTop();
    }).catch(() => {
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage?.sender !== 'assistant') {
          updatedMessages.push({ text: 'Error sending message.', sender: 'assistant' });
        }
        return updatedMessages;
      });
      this.loading.set(false);
      this.scrollToResponseTop();
    });
  }

  toggleBubble() {
    this.showBubble = !this.showBubble;
  }

  onToggleClick(event: MouseEvent) {
    if (this.suppressClick) {
      event.preventDefault();
      this.suppressClick = false;
      return;
    }
    this.toggleBubble();
  }

  onPointerStart(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.dragOffsetX = event.clientX;
    this.dragOffsetY = event.clientY;
    this.touchStartX = event.clientX;
    this.touchStartY = event.clientY;
    this.touchMoved = false;
    document.addEventListener('pointermove', this._pointerMoveHandler, { passive: false });
    document.addEventListener('pointerup', this._pointerUpHandler);
    document.addEventListener('pointercancel', this._pointerUpHandler);
  }

  onDragMove(event: PointerEvent) {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const clientX = event.clientX;
    const clientY = event.clientY;
    const totalDx = clientX - this.touchStartX;
    const totalDy = clientY - this.touchStartY;
    if (Math.abs(totalDx) > 10 || Math.abs(totalDy) > 10) {
      this.touchMoved = true;
    }

    const dx = clientX - this.dragOffsetX;
    const dy = clientY - this.dragOffsetY;
    if (this.chatBubble) {
      const toggleEl: HTMLElement | null = this.chatBubble.nativeElement.querySelector('.chat-toggle');
      const refRect = toggleEl ? toggleEl.getBoundingClientRect() : this.chatBubble.nativeElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newRight = this.bubblePosition.right - dx;
      let newTop = this.bubblePosition.top + dy;

      const maxRight = Math.max(0, viewportWidth - refRect.width);
      const maxTop = Math.max(0, viewportHeight - refRect.height);

      newRight = Math.max(0, Math.min(newRight, maxRight));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      this.bubblePosition.right = newRight;
      this.bubblePosition.top = newTop;
    }
    this.dragOffsetX = clientX;
    this.dragOffsetY = clientY;
  }

  onPointerEnd(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return;
    this.suppressClick = this.touchMoved;
    this.onDragEnd();
  }

  onDragEnd() {
    this.dragging = false;
    this.pointerId = null;
    document.removeEventListener('pointermove', this._pointerMoveHandler);
    document.removeEventListener('pointerup', this._pointerUpHandler);
    document.removeEventListener('pointercancel', this._pointerUpHandler);
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Shift+Enter will insert a new line by default
  }
}
