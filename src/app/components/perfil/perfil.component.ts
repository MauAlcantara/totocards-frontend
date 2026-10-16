import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { WearableService } from '../../services/wearable.service';
import { S3Service } from '../../services/s3.service';

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
  subiendoAvatar: boolean = false;

  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    public wearableService: WearableService,
    private s3Service: S3Service
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.obtenerUsuarioActual();
    if (currentUser) {
      this.usuario = { ...currentUser };
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.mostrar('Solo se permiten imágenes en formato JPG, PNG o WEBP.', 'error');
      event.target.value = '';
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      this.toastService.mostrar('La imagen excede el límite de 5 MB. Elige un archivo más ligero.', 'error');
      event.target.value = '';
      return;
    }

    this.subiendoAvatar = true;
    this.toastService.mostrar('Cargando imagen a AWS S3...', 'info');

    // Flujo AWS S3: Presigned URL -> PUT directo a S3 -> Registro de metadatos en Neon
    this.s3Service.subirArchivo(file, this.usuario.id_usuario).subscribe({
      next: (res: any) => {
        const urlS3 = res.archivo?.url_publica || res.publicUrl;
        this.usuario.avatar = urlS3;

        // Persistir en el perfil del usuario inmediatamente
        this.authService.actualizarPerfil({
          nombre: this.usuario.nombre,
          avatar: urlS3
        }).subscribe({
          next: () => {
            this.authService.actualizarUsuarioLocal({
              nombre: this.usuario.nombre,
              avatar: urlS3
            });
            this.toastService.mostrar('Foto actualizada y alojada en AWS S3.', 'success');
            this.subiendoAvatar = false;
          },
          error: (err) => {
            console.error('Error al actualizar avatar en perfil:', err);
            this.toastService.mostrar('Imagen subida a S3, pero hubo un detalle al actualizar el perfil.', 'info');
            this.subiendoAvatar = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al subir imagen a S3:', err);
        this.toastService.mostrar('Error al subir a AWS S3. Verifica CORS y permisos del bucket.', 'error');
        this.subiendoAvatar = false;
        event.target.value = '';
      }
    });
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