import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderCheckoutDetails {
  usuario_id: string; // Temporarily passed until generic JWT covers it
  direccion_envio: string;
  detalles: {
    producto_id: string;
    cantidad: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) { }

  checkout(orderData: OrderCheckoutDetails): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout`, orderData);
  }

  getAdminStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
