import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart/cart.service';

export interface Product {
  id: string;
  name: string;
  notes: string;
  genero?: string;
  price: number;
  imageUrl: string;
  soldCount: string;
  isNew: boolean;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product: Product = {
    id: '1',
    name: 'FLORAL ELEGANCE',
    notes: 'Jazmín, Rosas y Ámbar.',
    price: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47714263f?q=80&w=800&auto=format&fit=crop',
    soldCount: '0',
    isNew: true
  };

  constructor(private cartService: CartService) { }

  addToCart() {
    this.cartService.addToCart(this.product);
    // Optional: Add a toast notification here later
  }
}
