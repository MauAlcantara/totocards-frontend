import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  usuario: any = { id_usuario: '', nombre: '', email: '', avatar: '' };
  guardando: boolean = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.obtenerUsuarioActual();
    if (currentUser) {
      this.usuario = { ...currentUser };
    }
  }

  // Convierte la imagen a texto (Base64) cuando el usuario la selecciona
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.usuario.avatar = e.target.result; 
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambios(): void {
    this.guardando = true;
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Mandamos el nombre y la foto al backend
    this.http.put(`https://totocards-backend.onrender.com/api/auth/actualizar-perfil`, 
      { nombre: this.usuario.nombre, avatar: this.usuario.avatar }, 
      { headers }
    ).subscribe({
      next: (res) => {
        // Actualizamos el Gafete Virtual local para que los cambios se vean al instante
        const currentUser = this.authService.obtenerUsuarioActual();
        const updatedUser = { ...currentUser, nombre: this.usuario.nombre, avatar: this.usuario.avatar };
        localStorage.setItem('totouser', JSON.stringify(updatedUser));

        this.toastService.mostrar('¡Información guardada en la bóveda!', 'success');
        this.guardando = false;
        
        // Recarga la página para refrescar el header
        setTimeout(() => window.location.reload(), 1500);
      },
      error: (err) => {
        this.toastService.mostrar('Hubo un error al conectar con el servidor', 'error');
        this.guardando = false;
      }
    });
  }
}