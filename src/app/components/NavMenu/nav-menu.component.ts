import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  standalone: false,
  styleUrl: './nav-menu.scss',
  templateUrl: './nav-menu.component.html'
})
export class NavMenuComponent {
  constructor(private route: ActivatedRoute) {}
}
