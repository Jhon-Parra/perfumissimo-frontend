import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { OrderService } from '../../core/services/order/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  isProcessing = false;
  orderSuccess = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.items$;
  }

  get total(): number {
    return this.cartService.total;
  }

  updateQuantity(productId: string, newV: number): void {
    this.cartService.updateQuantity(productId, newV);
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  proceedToCheckout(): void {
    if (this.cartService.itemCount > 0) {
      this.isProcessing = true;

      const details = this.cartService.items.map(i => ({
        producto_id: i.product.id,
        cantidad: i.quantity
      }));

      const userIdDecoded = this.authService.getUserId();

      const orderData = {
        usuario_id: userIdDecoded || '00000000-0000-0000-0000-000000000000', // Usuario logueado o Guest
        direccion_envio: 'Calle Por Defecto 123 (Actualizar en perfil)',
        detalles: details
      };

      this.orderService.checkout(orderData).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.orderSuccess = true;
          this.cartService.clearCart();
          // this.router.navigate(['/success']); // En el futuro
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Error procesando el pago', err);
          alert('Hubo un error al procesar tu orden: ' + (err.error?.error || 'Verifica el servidor'));
        }
      });
    }
  }
}
