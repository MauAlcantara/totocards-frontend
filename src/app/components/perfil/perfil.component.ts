import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { WearableService } from '../../services/wearable.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  usuario: any = { id_usuario: '', nombre: '', email: '', avatar: '' };
  guardando: boolean = false;

  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    public wearableService: WearableService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.obtenerUsuarioActual();
    if (currentUser) {
      this.usuario = { ...currentUser };
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.mostrar('Solo se permiten imágenes en formato JPG, PNG o WEBP.', 'error');
      event.target.value = '';
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSizeInBytes) {
      this.toastService.mostrar('La imagen excede el límite de 2 MB. Elige una imagen más liviana.', 'error');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.usuario.avatar = e.target.result; 
    };
    reader.readAsDataURL(file);
  }

  guardarCambios(): void {
    this.guardando = true;

    this.authService.actualizarPerfil({
      nombre: this.usuario.nombre,
      avatar: this.usuario.avatar
    }).subscribe({
      next: () => {
        this.authService.actualizarUsuarioLocal({
          nombre: this.usuario.nombre,
          avatar: this.usuario.avatar
        });
        this.toastService.mostrar('¡Información guardada exitosamente en la bóveda!', 'success');
        this.guardando = false;
      },
      error: (err) => {
        this.toastService.mostrar(err.error?.mensaje || 'Hubo un error al actualizar tu perfil.', 'error');
        this.guardando = false;
      }
    });
  }

  conectarSmartwatch(): void {
    this.wearableService.conectarDispositivo();
  }

  desconectarSmartwatch(): void {
    this.wearableService.desconectar();
    this.toastService.mostrar('Dispositivo desvinculado.', 'info');
  }
}