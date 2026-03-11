import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' };
  registerData = { nombre: '', apellido: '', telefono: '', email: '', password: '' };
  isLoginMode = true;
  isLoading = false;
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '129037757547-mvt7e9b254t59dc4s7mu8vnth62lf7lr.apps.googleusercontent.com',
        callback: this.handleGoogleResponse.bind(this)
      });
      google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        {
          theme: "outline",
          size: "large",
          width: 320,
          type: "standard"
        }
      );
    }
  }

  handleGoogleResponse(response: any) {
    if (response.credential) {
      this.ngZone.run(() => {
        this.isLoading = true;
        this.authService.loginWithGoogle(response.credential).subscribe({
          next: (res) => {
            this.isLoading = false;

            // Obtener returnUrl de los parámetros de la ruta, o por defecto ir al catálogo
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];

            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
            } else if (res.user && res.user.rol === 'ADMIN') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/catalog']); // A la tienda por defecto
            }
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.errorMsg = 'Error al iniciar sesión con Google.';
          }
        });
      });
    }
  }

  switchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMsg = '';
  }

  onSubmit() {
    if (this.isLoginMode) {
      if (!this.credentials.email || !this.credentials.password) return;
    } else {
      if (!this.registerData.nombre || !this.registerData.apellido || !this.registerData.telefono || !this.registerData.email || !this.registerData.password) return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    const authObservable = this.isLoginMode
      ? this.authService.login(this.credentials.email, this.credentials.password)
      : this.authService.register(this.registerData);

    authObservable.subscribe({
      next: () => {
        this.isLoading = false;

        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.error || 'Credenciales inválidas o el servidor está apagado.';
      }
    });
  }
}
