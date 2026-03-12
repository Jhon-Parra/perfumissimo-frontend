import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../../../shared/components/product-card/product-card.component';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentItems = [...this.items];
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentItems.push({ product, quantity });
    }

    this.updateCart(currentItems);
  }

  removeFromCart(productId: string): void {
    const currentItems = this.items.filter(item => item.product.id !== productId);
    this.updateCart(currentItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentItems = [...this.items];
    const item = currentItems.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.updateCart(currentItems);
    }
  }

  clearCart(): void {
    this.updateCart([]);
  }

  clearCartStorage(): void {
    this.itemsSubject.next([]);
    try {
      localStorage.removeItem('perfumissimo_cart');
    } catch {
      // ignore
    }
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private updateCart(items: CartItem[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem('perfumissimo_cart', JSON.stringify(items));
  }

  private loadCart(): void {
    const stored = localStorage.getItem('perfumissimo_cart');
    if (stored) {
      try {
        this.itemsSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored cart', e);
        this.itemsSubject.next([]);
      }
    }
  }
}
