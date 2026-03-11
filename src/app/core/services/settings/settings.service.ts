import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Settings {
    hero_title: string;
    hero_subtitle: string;
    accent_color: string;
    show_banner: boolean;
    banner_text: string;
    hero_image_url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private apiUrl = 'http://localhost:3000/api/settings';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getSettings(): Observable<Settings> {
        return this.http.get<Settings>(this.apiUrl);
    }

    updateSettings(settings: Settings | FormData): Observable<any> {
        return this.http.put(this.apiUrl, settings, { headers: this.getHeaders() });
    }
}
