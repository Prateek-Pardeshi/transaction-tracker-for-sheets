import { AfterViewChecked, Component, ElementRef, signal, ViewChild } from '@angular/core';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

@Component({
  selector: 'app-chat-slider',
  standalone: false,
  templateUrl: './chat-slider.component.html'
})
export class ChatSliderComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  inputText = '';
  isTyping = signal(false);

  messages = signal<Message[]>([
    { id: 1, text: 'Hey! How can I help you today?', sender: 'bot', time: '9:41 AM' },
    { id: 2, text: 'I need help with my Angular component.', sender: 'user', time: '9:42 AM', status: 'read' },
    { id: 3, text: 'Sure! What are you building? I can help with templates, signals, routing, or anything else.', sender: 'bot', time: '9:42 AM' },
    { id: 4, text: 'A chat UI with Tailwind CSS 😄', sender: 'user', time: '9:43 AM', status: 'read' },
    { id: 5, text: 'Great choice! Here\'s a fully working component. Let me know if you want any changes.', sender: 'bot', time: '9:43 AM' },
    { id: 6, text: 'Hey! How can I help you today?', sender: 'bot', time: '9:41 AM' },
    { id: 7, text: 'I need help with my Angular component.', sender: 'user', time: '9:42 AM', status: 'read' },
    { id: 8, text: 'Sure! What are you building? I can help with templates, signals, routing, or anything else.', sender: 'bot', time: '9:42 AM' },
    { id: 9, text: 'A chat UI with Tailwind CSS 😄', sender: 'user', time: '9:43 AM', status: 'read' },
    { id: 10, text: 'Great choice! Here\'s a fully working component. Let me know if you want any changes.', sender: 'bot', time: '9:43 AM' },
  ]);

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.update(msgs => [
      ...msgs,
      { id: Date.now(), text, sender: 'user', time: now, status: 'sent' }
    ]);

    this.inputText = '';
    this.resetTextarea();
    this.shouldScroll = true;

    // Simulate bot reply
    this.isTyping.set(true);
    this.shouldScroll = true;

    setTimeout(() => {
      this.isTyping.set(false);
      this.messages.update(msgs => [
        ...msgs,
        {
          id: Date.now() + 1,
          text: this.getBotReply(text),
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      this.shouldScroll = true;
    }, 1500);
  }

  autoResize(): void {
    const el = this.inputRef?.nativeElement;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 128) + 'px';
    }
  }

  private resetTextarea(): void {
    const el = this.inputRef?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private getBotReply(text: string): string {
    const replies = [
      'That\'s a great point! Let me think about that...',
      'Got it! Here\'s what I suggest...',
      'Interesting! Could you tell me more?',
      'I\'m on it! Give me a moment.',
      'Absolutely! Here\'s how you can approach this.',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  closeSlider(): void {
    document.body.classList.remove('overflow-hidden');
  }
}
