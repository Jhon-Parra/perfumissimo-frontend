import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    rol: string;
    creado_en: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/users';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    updateUserRole(id: string, rol: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/role`, { rol }, { headers: this.getHeaders() });
    }
}
