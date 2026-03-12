import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardComponent, Product } from '../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../core/services/product/product.service';
import { SeoService } from '../../../core/services/seo/seo.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error = '';
  selectedCategory = 'todos';
  searchTerm = '';
  selectedPromotionId = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService
  ) { }

  ngOnInit(): void {
    this.seo.set({
      title: 'Catalogo | Perfumissimo',
      description: 'Explora perfumes para mujer, hombre y unisex. Filtra por categoria y encuentra tu aroma ideal.'
    });

    this.productService.getPublicCatalog().subscribe({
      next: (apiProducts) => {
        this.products = apiProducts.map(ap => ({
          // Precio final (con promo si aplica) en `price` para el carrito
          id: ap.id || '',
          promo_id: (ap as any).promo_id || null,
          name: ap.nombre,
          notes: ap.descripcion,
          price: ap.precio_con_descuento ? Number(ap.precio_con_descuento) : (typeof ap.precio === 'string' ? parseFloat(ap.precio) : ap.precio),
          imageUrl: ap.imagen_url || 'https://images.unsplash.com/photo-1594035910387-fea47714263f?q=80&w=800&auto=format&fit=crop',
          soldCount: (ap.unidades_vendidas || 0).toString(),
          isNew: !!ap.es_nuevo,
          genero: ap.genero,
          precio: (() => {
            const original = (ap as any).precio_original ?? ap.precio;
            return typeof original === 'string' ? parseFloat(original) : original;
          })(),
          precio_con_descuento: ap.precio_con_descuento !== null && ap.precio_con_descuento !== undefined ? Number(ap.precio_con_descuento) : null,
          tiene_promocion: ap.tiene_promocion || false
        }));

        this.route.queryParams.subscribe(params => {
          this.searchTerm = params['q'] || '';
          this.selectedCategory = params['category'] || 'todos';
          this.selectedPromotionId = params['promo'] || '';
          this.applyFilters();

          const parts: string[] = [];
          if (this.selectedCategory && this.selectedCategory !== 'todos') {
            parts.push(this.selectedCategory === 'mujer' ? 'Mujer' : (this.selectedCategory === 'hombre' ? 'Hombre' : 'Unisex'));
          }
          if (this.searchTerm && String(this.searchTerm).trim()) {
            parts.push(`Busqueda: ${String(this.searchTerm).trim()}`);
          }
          if (this.selectedPromotionId) {
            parts.push('Promocion');
          }

          const suffix = parts.length ? ` (${parts.join(' · ')})` : '';
          this.seo.set({
            title: `Catalogo${suffix} | Perfumissimo`,
            description: 'Explora perfumes para mujer, hombre y unisex. Filtra por categoria y encuentra tu aroma ideal.'
          });
        });

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error cargando el catálogo.';
        this.loading = false;
      }
    });
  }

  filterCategory(category: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category !== 'todos' ? category : null },
      queryParamsHandling: 'merge',
    });
  }

  applyFilters() {
    let result = this.products;

    if (this.selectedPromotionId) {
      result = result.filter(p => (p as any).promo_id === this.selectedPromotionId);
    }

    if (this.selectedCategory && this.selectedCategory !== 'todos') {
      result = result.filter(p => p.genero === this.selectedCategory);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.notes.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = result;
  }
}
