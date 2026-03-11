import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService, Settings } from '../../../core/services/settings/settings.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  cartItemCount$!: Observable<number>;
  settings: Settings | null = null;

  constructor(
    private cartService: CartService,
    public authService: AuthService,
    private settingsService: SettingsService
  ) {
    this.cartItemCount$ = this.cartService.items$.pipe(
      map(items => items.reduce((acc, item) => acc + item.quantity, 0))
    );
  }

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (data) => this.settings = data,
      error: (err) => console.error('Error cargando configuraciones', err)
    });
  }

  logout() {
    this.authService.logout();
  }
}
