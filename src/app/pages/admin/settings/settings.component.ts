import { Component, OnInit } from '@angular/core';
import { API_CONFIG } from '../../../core/config/api-config';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService, Settings } from '../../../core/services/settings/settings.service';
import { LowStockBellComponent } from '../../../shared/components/low-stock-bell/low-stock-bell.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LowStockBellComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  settings: Settings = {
    hero_title: 'Cargando...',
    hero_subtitle: 'Cargando...',
    accent_color: '#C2A878',
    show_banner: false,
    banner_text: '',
    hero_image_url: '',

    logo_url: '',
    logo_height_mobile: 96,
    logo_height_desktop: 112,

    instagram_url: '',
    facebook_url: '',
    whatsapp_number: '',
    whatsapp_message: ''
    ,
    email_from_name: '',
    email_from_address: '',
    email_reply_to: '',
    email_bcc_orders: '',

    boutique_title: 'Nuestra Boutique',
    boutique_address_line1: 'Calle 12 #13-85',
    boutique_address_line2: 'Bogotá, Colombia',
    boutique_phone: '+57 (300) 123-4567',
    boutique_email: 'contacto@perfumissimo.com'
  };

  selectedFile: File | null = null;
  selectedLogoFile: File | null = null;
  saving = false;

  instagramTokenInput = '';

  constructor(private authService: AuthService, private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.settings = {
          ...this.settings,
          ...data,
          logo_height_mobile: (data as any)?.logo_height_mobile ?? 96,
          logo_height_desktop: (data as any)?.logo_height_desktop ?? 112,
          logo_url: (data as any)?.logo_url ?? ''
        };
        this.instagramTokenInput = '';
      },
      error: (err) => console.error('Error al cargar configuración', err)
    });
  }

  getHeroImageUrl(): string {
    const url = this.settings.hero_image_url;
    if (!url) return '';
    // Si es una imagen base64 (recién seleccionada) o una URL HTTP completa (Supabase)
    if (url.startsWith('data:') || url.startsWith('http')) {
      return url;
    }
    // Fallback: Si por alguna razón es relativa, forzamos un dominio (aunque Supabase devuelve URLs absolutas)
    return `${API_CONFIG.serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Mostrar preview (Opcional, si queremos mostrarlo)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.hero_image_url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getLogoUrl(): string {
    const url = (this.settings.logo_url || '').trim();
    if (!url) return 'assets/images/logo.png';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_CONFIG.serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.logo_url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveSettings() {
    this.saving = true;

    // Crear FormData y adjuntar archivos
    const formData = new FormData();
    formData.append('hero_title', this.settings.hero_title);
    formData.append('hero_subtitle', this.settings.hero_subtitle);
    formData.append('accent_color', this.settings.accent_color);
    formData.append('show_banner', this.settings.show_banner ? 'true' : 'false');
    formData.append('banner_text', this.settings.banner_text);

    formData.append('logo_height_mobile', String(this.settings.logo_height_mobile ?? 96));
    formData.append('logo_height_desktop', String(this.settings.logo_height_desktop ?? 112));

    formData.append('instagram_url', this.settings.instagram_url || '');
    formData.append('facebook_url', this.settings.facebook_url || '');
    formData.append('whatsapp_number', this.settings.whatsapp_number || '');
    formData.append('whatsapp_message', this.settings.whatsapp_message || '');

    formData.append('email_from_name', this.settings.email_from_name || '');
    formData.append('email_from_address', this.settings.email_from_address || '');
    formData.append('email_reply_to', this.settings.email_reply_to || '');
    formData.append('email_bcc_orders', this.settings.email_bcc_orders || '');

    formData.append('boutique_title', this.settings.boutique_title || '');
    formData.append('boutique_address_line1', this.settings.boutique_address_line1 || '');
    formData.append('boutique_address_line2', this.settings.boutique_address_line2 || '');
    formData.append('boutique_phone', this.settings.boutique_phone || '');
    formData.append('boutique_email', this.settings.boutique_email || '');

    // Token IG: solo enviar si el admin lo escribe (no sobreescribir si queda vacio)
    if (this.instagramTokenInput.trim()) {
      formData.append('instagram_access_token', this.instagramTokenInput.trim());
    }

    if (this.selectedFile) {
      formData.append('hero_image', this.selectedFile);
    }

    if (this.selectedLogoFile) {
      formData.append('logo_image', this.selectedLogoFile);
    }

    this.settingsService.updateSettings(formData).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.hero_image_url) {
          this.settings.hero_image_url = res.hero_image_url;
        }
        if (res && res.logo_url) {
          this.settings.logo_url = res.logo_url;
        }
        this.instagramTokenInput = '';
        alert('Configuración actualizada exitosamente');
      },
      error: (err) => {
        this.saving = false;
        console.error('Error:', err);
        alert('Hubo un error al guardar');
      }
    });
  }

  resetToDefault() {
    if (confirm('¿Estás seguro de restablecer los valores originales? Esto sobrescribirá la configuración actual en pantalla.')) {
      this.settings = {
        hero_title: 'La Esencia del Lujo',
        hero_subtitle: 'Descubre colecciones exclusivas creadas por maestros perfumistas de todo el mundo.',
        accent_color: '#C379AC',
        show_banner: true,
        banner_text: 'ENVÍO GRATIS EN PEDIDOS SUPERIORES 5000',
        hero_image_url: '/assets/images/hero_bg.webp',
        logo_url: '',
        logo_height_mobile: 96,
        logo_height_desktop: 112,
        instagram_url: '',
        facebook_url: '',
        whatsapp_number: '',
        whatsapp_message: '',
        email_from_name: '',
        email_from_address: '',
        email_reply_to: '',
        email_bcc_orders: '',

        boutique_title: 'Nuestra Boutique',
        boutique_address_line1: 'Calle 12 #13-85',
        boutique_address_line2: 'Bogotá, Colombia',
        boutique_phone: '+57 (300) 123-4567',
        boutique_email: 'contacto@perfumissimo.com'
      };
      this.selectedFile = null;
      this.selectedLogoFile = null;
    }
  }

  logout() {
    this.authService.logout();
  }
}
