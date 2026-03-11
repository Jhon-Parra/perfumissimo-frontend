import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../core/services/product/product.service';
import { AiService } from '../../../core/services/ai/ai.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  showForm = false;
  products: Product[] = [];

  newProduct = {
    nombre: '',
    genero: 'unisex',
    notas: '',
    precio: 0,
    stock: 0,
    descripcion: ''
  };
  selectedFile: File | null = null;
  isGeneratingAI = false;
  isSaving = false;

  constructor(
    private productService: ProductService,
    private aiService: AiService,
    private authService: AuthService // Injected AuthService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => {
      this.products = res;
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  generateAI() {
    if (!this.newProduct.notas) {
      alert('Por favor ingresa unas notas olfativas primero.');
      return;
    }

    this.isGeneratingAI = true;
    this.aiService.generateDescription(this.newProduct.notas).subscribe({
      next: (res) => {
        this.newProduct.descripcion = res.descripcion;
        this.isGeneratingAI = false;
      },
      error: (err) => {
        console.error(err);
        alert('Error generando descripción');
        this.isGeneratingAI = false;
      }
    });
  }

  saveProduct() {
    if (!this.newProduct.nombre || !this.newProduct.precio) {
      alert("El nombre y el precio son requeridos.");
      return;
    }

    this.isSaving = true;
    const formData = new FormData();
    formData.append('nombre', this.newProduct.nombre);
    formData.append('genero', this.newProduct.genero);
    formData.append('notas', this.newProduct.notas); // Optional frontend detail conceptually mapped to descripcion if needed
    formData.append('descripcion', this.newProduct.descripcion);
    formData.append('precio', this.newProduct.precio.toString());
    formData.append('stock', this.newProduct.stock.toString());
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.productService.createProduct(formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadProducts();
        this.toggleForm();
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear el producto');
        this.isSaving = false;
      }
    });
  }

  deleteProduct(id: string) {
    if (confirm('¿Seguro de eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  resetForm() {
    this.newProduct = { nombre: '', genero: 'unisex', notas: '', precio: 0, stock: 0, descripcion: '' };
    this.selectedFile = null;
  }

  logout() {
    this.authService.logout();
  }
}
