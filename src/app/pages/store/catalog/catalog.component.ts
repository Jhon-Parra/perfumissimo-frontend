import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductCardComponent, Product } from '../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../core/services/product/product.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, ProductCardComponent],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error = '';
  selectedCategory = 'todos';

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
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
        this.filteredProducts = [...this.products];
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
    this.selectedCategory = category;
    if (category === 'todos') {
      this.filteredProducts = [...this.products];
    } else {
      // Simulación de Filtro Frontend (Busca la palabra en el nombre o descripción)
      this.filteredProducts = this.products.filter(p =>
        p.notes.toLowerCase().includes(category) ||
        p.name.toLowerCase().includes(category)
      );
    }
  }
}
