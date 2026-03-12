import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { OrderService, Order } from '../../../core/services/order/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css']
})
export class OrderSuccessComponent {
  loading = true;
  error = '';
  order: Order | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Orden inválida.';
        this.loading = false;
        return;
      }
      this.fetch(id);
    });
  }

  private fetch(id: string): void {
    this.loading = true;
    this.error = '';
    this.order = null;

    this.orderService.getMyOrderById(id).subscribe({
      next: (o) => {
        this.order = o;
        this.loading = false;
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401 || status === 403) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: `/order-success/${encodeURIComponent(id)}` } });
          return;
        }
        this.error = err?.error?.message || err?.error?.error || 'No se pudo cargar el detalle del pedido.';
        this.loading = false;
      }
    });
  }

  print(): void {
    window.print();
  }

  getUserName(): string {
    return this.authService.getUserFullName() || 'Cliente';
  }
}
