import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Directive({
  selector: '[appIconInjector]',
  standalone: true
})
export class IconInjectorDirective implements OnChanges {

  @Input() appIcon!: string | SafeHtml;

  constructor(
    private sanitizer: DomSanitizer,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges(): void {
    if (!this.appIcon) return;

    const safeHtml: SafeHtml = 
      this.appIcon instanceof Object
        ? this.appIcon
        : this.sanitizer.bypassSecurityTrustHtml(this.appIcon);

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', safeHtml);
  }
}
