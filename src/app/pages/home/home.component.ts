import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent, Product } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product/product.service';
import { SettingsService, Settings } from '../../core/services/settings/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error = '';
  settings: Settings | null = null;

  constructor(
    private productService: ProductService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    // Cargar configuraciones globales (Textos y Colores)
    this.settingsService.getSettings().subscribe({
      next: (data) => this.settings = data,
      error: (err) => console.error('Error cargando configuración', err)
    });
    this.productService.getProducts().subscribe({
      next: (apiProducts) => {
        this.products = apiProducts.map(ap => ({
          id: ap.id || '',
          name: ap.nombre,
          notes: ap.descripcion,
          price: typeof ap.precio === 'string' ? parseFloat(ap.precio) : ap.precio,
          imageUrl: ap.imagen_url || 'https://images.unsplash.com/photo-1594035910387-fea47714263f?q=80&w=800&auto=format&fit=crop',
          soldCount: (ap.unidades_vendidas || 0).toString(),
          isNew: true
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.error = 'No se pudieron cargar los productos. Asegúrese de que el backend esté en ejecución.';
        this.loading = false;
      }
    });
  }

  getHeroImageUrl(): string {
    if (this.settings && this.settings.hero_image_url) {
      if (this.settings.hero_image_url.startsWith('http') || this.settings.hero_image_url.startsWith('data:') || this.settings.hero_image_url.startsWith('/assets/')) {
        return this.settings.hero_image_url;
      }
      return `http://localhost:3000${this.settings.hero_image_url}`;
    }
    // Imagen por defecto si no hay nada configurado
    return 'https://images.unsplash.com/photo-1615397323891-b6aab016b801?q=80&w=2000&auto=format&fit=crop';
  }
}
