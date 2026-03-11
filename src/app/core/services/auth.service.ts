import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, paramPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password: paramPassword })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('auth_token', response.token);
          }
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      })
    );
  }

  loginWithGoogle(credential: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/google`, { credential }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getUserRole(): string {
    const token = localStorage.getItem('auth_token');
    if (!token) return 'GUEST';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol || 'GUEST';
    } catch {
      return 'GUEST';
    }
  }

  getUserId(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  }
}
