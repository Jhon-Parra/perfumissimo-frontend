import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api-config';

export type WompiMerchant = {
  name: string | null;
  presigned_acceptance: {
    acceptance_token: string;
    permalink: string;
  };
};

export type WompiPseBank = {
  financial_institution_code: string;
  financial_institution_name: string;
};

export type WompiPseCheckoutRequest = {
  total: number;
  shipping_address: string;
  items: Array<{ product_id: string; quantity: number; price: number }>;

  acceptance_token: string;
  user_type: '0' | '1';
  user_legal_id_type: string;
  user_legal_id: string;
  financial_institution_code: string;
};

export type WompiPseCheckoutResponse = {
  message: string;
  orderId: string;
  transactionId: string;
  asyncPaymentUrl: string;
  redirectUrl: string;
};

@Injectable({
  providedIn: 'root'
})
export class WompiService {
  private apiUrl = `${API_CONFIG.baseUrl}/payments/wompi`;

  constructor(private http: HttpClient) {}

  getMerchant(): Observable<WompiMerchant> {
    return this.http.get<WompiMerchant>(`${this.apiUrl}/merchant`);
  }

  getPseBanks(): Observable<{ data: WompiPseBank[] }> {
    return this.http.get<{ data: WompiPseBank[] }>(`${this.apiUrl}/pse/banks`);
  }

  createPseCheckout(payload: WompiPseCheckoutRequest): Observable<WompiPseCheckoutResponse> {
    return this.http.post<WompiPseCheckoutResponse>(`${this.apiUrl}/pse/checkout`, payload, {
      withCredentials: true
    });
  }
}
