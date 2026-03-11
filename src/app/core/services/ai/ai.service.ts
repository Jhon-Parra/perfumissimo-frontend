import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private http: HttpClient) { }

  generateDescription(notasOlfativas: string): Observable<{ descripcion: string }> {
    return this.http.post<{ descripcion: string }>('http://localhost:3000/api/products/generate-description', { notasOlfativas });
  }
}
