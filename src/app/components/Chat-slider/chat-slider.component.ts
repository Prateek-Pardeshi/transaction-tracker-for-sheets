import { OnInit, AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, ChangeDetectionStrategy, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { map, Observable } from 'rxjs';
import { GoogleSheetsService } from '@/app/services/googleSheetService.service';
import { ConfigService } from '@services/config.service';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  suggestions?: string[];
}

@Component({
  selector: 'app-chat-slider',
  standalone: false,
  templateUrl: './chat-slider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatSliderComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  private destroy$ = new Subject<void>();

  constructor(
    private sheetsService: GoogleSheetsService,
    private configService: ConfigService,
    private http: HttpClient
  ) {}

  inputText = '';
  isTyping = signal(false);
  isAIModelsDropdownOpen = signal(false);
  sessionId = 'default';
  selectedModel: any;

  messages = signal<Message[]>([
    { id: 1, text: 'Hey! How can I help you today?', sender: 'bot', time: '9:41 AM', suggestions: ["give me detailed bifurcation of expenses till date"] },
    ]);

  private shouldScroll = false;

  ngOnInit(): void {
    this.selectedModel = {  code: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nvidia/Nemotron-3-Nano' };
  }

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

    this.getBotReply(text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ 
        next: (response) => {
          this.isTyping.set(false);
          this.messages.update(msgs => [
            ...msgs,
            {
              id: Date.now() + 1,
              text: response.response,
              sender: 'bot',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: response.suggestions || []
            }
          ]);
          this.shouldScroll = true;
        },
        error: (error) => {
          if (error.detail)
          this.messages.update(msgs => [
            ...msgs,
            {
              id: Date.now() + 1,
              text: error.detail || 'Sorry, something went wrong.',
              sender: 'bot',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: []
            }
          ]);
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

  onSugestionClick(suggestion: string): void {
    this.inputText = suggestion;
    this.autoResize();
    this.inputRef.nativeElement.focus();
    this.send();
  }

  toggleAIModelsDropdown(): void {
    this.isAIModelsDropdownOpen.update(val => !val);
  }

  selectAIModel(model: any): void {
    this.selectedModel = model;
    this.autoResize();
    this.closeAIModelDropdown();
  }

  closeAIModelDropdown(): void {
    this.isAIModelsDropdownOpen.set(false);
    this.inputRef.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getBotReply(text: string): Observable<any> {
    const url = this.configService.config.FINANCE_API_URL + '/chat/send';
    const payload = { session_id: this.sessionId, message: text, model_name: this.selectedModel.code, data: this.sheetsService.sheetDetails.transactionList || [] };
    return this.http.post(url, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map((res: any) => {
        const response = JSON.parse(res.response) || 'Sorry, I couldn\'t process that.';
        this.sessionId = response.session_id || this.sessionId;
        return response;
      })
    );
  }

}
