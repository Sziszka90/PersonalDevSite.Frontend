import { Component, inject, ViewChild, ElementRef } from '@angular/core';
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
  loading = false;
  showBubble = false;
  messages: { text: string, sender: 'user' | 'assistant' }[] = [
    { text: 'Hi! Welcome to my personal website. Feel free to ask me anything about my experience, skills, or projects!', sender: 'assistant' }
  ];
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragging = false;
  bubblePosition = { top: 100, right: 32 };
  touchStartTime = 0;
  touchStartX = 0;
  touchStartY = 0;
  touchMoved = false;

  private _handleDocumentClick!: (e: MouseEvent) => void;
  private _mouseMoveHandler!: (e: MouseEvent) => void;
  private _mouseUpHandler!: (e: MouseEvent) => void;
  private _touchMoveHandler!: (e: TouchEvent) => void;
  private _touchEndHandler!: (e: TouchEvent) => void;

  constructor() {
    this._handleDocumentClick = this.handleDocumentClick.bind(this);
    this._mouseMoveHandler = this.onDragMove.bind(this) as unknown as (e: MouseEvent) => void;
    this._mouseUpHandler = this.onDragEnd.bind(this) as unknown as (e: MouseEvent) => void;
    this._touchMoveHandler = this.onDragMove.bind(this) as unknown as (e: TouchEvent) => void;
    this._touchEndHandler = this.onDragEnd.bind(this) as unknown as (e: TouchEvent) => void;

    document.addEventListener('click', this._handleDocumentClick);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this._handleDocumentClick);
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
    if (!this.message.trim() || this.loading) return;
    const msgToSend = this.message;
    this.message = '';
    this.loading = true;
    this.messages.push({ text: msgToSend, sender: 'user' });
    const assistantMessage = { text: '', sender: 'assistant' as const };
    this.messages.push(assistantMessage);
    this.scrollToBottom();

    this.apiService.streamChat(msgToSend, delta => {
      assistantMessage.text += delta;
      this.scrollToBottom();
    }).then(() => {
      if (!assistantMessage.text) {
        assistantMessage.text = 'No response';
      }
      this.loading = false;
      this.scrollToBottom();
    }).catch(() => {
      assistantMessage.text = assistantMessage.text || 'Error sending message.';
      this.loading = false;
      this.scrollToBottom();
    });
  }

  toggleBubble() {
    this.showBubble = !this.showBubble;
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    this.dragging = true;
    if (event instanceof TouchEvent) {
      event.preventDefault();
      this.dragOffsetX = event.touches[0].clientX;
      this.dragOffsetY = event.touches[0].clientY;
      document.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
      document.addEventListener('touchend', this._touchEndHandler);
    } else {
      this.dragOffsetX = event.clientX;
      this.dragOffsetY = event.clientY;
      document.addEventListener('mousemove', this._mouseMoveHandler);
      document.addEventListener('mouseup', this._mouseUpHandler);
    }
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.dragging) return;
    if (event instanceof TouchEvent) {
      event.preventDefault();
    }
    let clientX, clientY;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
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

  onDragEnd() {
    this.dragging = false;
    document.removeEventListener('mousemove', this._mouseMoveHandler);
    document.removeEventListener('mouseup', this._mouseUpHandler);
    document.removeEventListener('touchmove', this._touchMoveHandler);
    document.removeEventListener('touchend', this._touchEndHandler);
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.onDragStart(event);
  }

  onTouchMove(event: TouchEvent) {
    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      this.touchMoved = true;
    }
    this.onDragMove(event);
  }

  onTouchEnd(event: TouchEvent) {
    this.onDragEnd();
    const tapDuration = Date.now() - this.touchStartTime;
    if (!this.touchMoved && tapDuration < 300) {
      this.toggleBubble();
    }
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Shift+Enter will insert a new line by default
  }
}
