import { Component, inject, ViewChild, ElementRef, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  sendMessage() {
    if (!this.message.trim() || this.loading()) return;
    const msgToSend = this.message;
    this.message = '';
    this.loading.set(true);
    const assistantMessageIndex = this.messages().length + 1;
    this.messages.update(messages => [
      ...messages,
      { text: msgToSend, sender: 'user' },
      { text: '', sender: 'assistant' }
    ]);
    this.scrollToBottom();

    this.apiService.streamChat(msgToSend, delta => {
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const assistantMessage = updatedMessages[assistantMessageIndex];
        if (assistantMessage) {
          updatedMessages[assistantMessageIndex] = {
            ...assistantMessage,
            text: assistantMessage.text + delta
          };
        }
        return updatedMessages;
      });
      this.scrollToBottom();
    }).then(() => {
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const assistantMessage = updatedMessages[assistantMessageIndex];
        if (assistantMessage && !assistantMessage.text) {
          updatedMessages[assistantMessageIndex] = {
            ...assistantMessage,
            text: 'No response'
          };
        }
        return updatedMessages;
      });
      this.loading.set(false);
      this.scrollToBottom();
    }).catch(() => {
      this.messages.update(messages => {
        const updatedMessages = [...messages];
        const assistantMessage = updatedMessages[assistantMessageIndex];
        if (assistantMessage && !assistantMessage.text) {
          updatedMessages[assistantMessageIndex] = {
            ...assistantMessage,
            text: 'Error sending message.'
          };
        }
        return updatedMessages;
      });
      this.loading.set(false);
      this.scrollToBottom();
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
