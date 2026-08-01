import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.cargando = true;
    this.mensajeError = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login exitoso:', res);
        this.cargando = false;
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.mensaje || 'Ocurrió un error en el servidor.';
      }
    });
  }
}