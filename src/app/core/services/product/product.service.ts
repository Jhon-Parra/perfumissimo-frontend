import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  nombre: string;
  genero?: 'mujer' | 'hombre' | 'unisex';
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  unidades_vendidas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private publicUrl = 'http://localhost:3000/api/products-catalog';
  private adminUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.publicUrl);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.publicUrl}/${id}`);
  }

  // Expects FormData because it includes the image file
  createProduct(productData: FormData): Observable<any> {
    return this.http.post(this.adminUrl, productData);
  }

  updateProduct(id: string, productData: FormData): Observable<any> {
    return this.http.put(`${this.adminUrl}/${id}`, productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${id}`);
  }
}
