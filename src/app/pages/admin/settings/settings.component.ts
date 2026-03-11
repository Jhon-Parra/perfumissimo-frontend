import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService, Settings } from '../../../core/services/settings/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  settings: Settings = {
    hero_title: 'Cargando...',
    hero_subtitle: 'Cargando...',
    accent_color: '#C2A878',
    show_banner: false,
    banner_text: '',
    hero_image_url: ''
  };

  selectedFile: File | null = null;
  saving = false;

  constructor(private authService: AuthService, private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (data) => this.settings = data,
      error: (err) => console.error('Error al cargar configuración', err)
    });
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

  saveSettings() {
    this.saving = true;

    // Crear FormData y adjuntar archivos
    const formData = new FormData();
    formData.append('hero_title', this.settings.hero_title);
    formData.append('hero_subtitle', this.settings.hero_subtitle);
    formData.append('accent_color', this.settings.accent_color);
    formData.append('show_banner', this.settings.show_banner ? 'true' : 'false');
    formData.append('banner_text', this.settings.banner_text);

    if (this.selectedFile) {
      formData.append('hero_image', this.selectedFile);
    }

    this.settingsService.updateSettings(formData).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.hero_image_url) {
          this.settings.hero_image_url = res.hero_image_url;
        }
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
        hero_image_url: '/assets/images/hero_bg.webp'
      };
      this.selectedFile = null;
    }
  }

  logout() {
    this.authService.logout();
  }
}
