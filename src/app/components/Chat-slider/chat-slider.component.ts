import { AfterViewChecked, Component, ElementRef, Inject, Injector, signal, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GoogleSheetsService } from '@/app/services/googleSheetService.service';
import { map, Observable } from 'rxjs';
import { ConfigService } from '@services/config.service';

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

  constructor(@Inject(Injector) private injector: Injector, private http: HttpClient) {}

  get sheetsService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService); }
  get configService(): ConfigService { return this.injector.get(ConfigService); }

  inputText = '';
  isTyping = signal(false);
  sessionId = 'default';

  messages = signal<Message[]>([
    { id: 1, text: 'Hey! How can I help you today?', sender: 'bot', time: '9:41 AM' },
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

    this.getBotReply(text).subscribe({ 
      next: (response) => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          {
            id: Date.now() + 1,
            text: response,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        this.shouldScroll = true;
      },
      error: (error) => {
        this.isTyping.set(false);
      }
    });
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

  private getBotReply(text: string): Observable<any> {
    const url = this.configService.config.FINANCE_API_URL + '/chat/send';
    const payload = { session_id: this.sessionId, message: text, data: this.sheetsService.sheetDetails.transactionList || [] };
    return this.http.post(url, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map((res: any) => {
        const response = JSON.parse(res.response) || 'Sorry, I couldn\'t process that.';
        this.sessionId = response.session_id || this.sessionId;
        return response.response;
      })
    );
  }

  closeSlider(): void {
    document.body.classList.remove('overflow-hidden');
  }
}
