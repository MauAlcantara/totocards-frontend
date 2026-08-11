import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  contacto = { nombre: '', email: '', mensaje: '' };
  
  mensajeEnviado = false;
  estadoEnvio = '';

  constructor(private http: HttpClient, private toastService: ToastService) {}

  enviarMensaje(formulario: any): void {
    if (formulario.invalid) {
      this.toastService.mostrar('Por favor, revisa que tus datos sean correctos.', 'error');
      Object.keys(formulario.controls).forEach(campo => {
        formulario.controls[campo].markAsTouched();
      });
      return;
    }

    this.estadoEnvio = 'Enviando tu mensaje al equipo de TotoCards...';
    
    this.http.post('https://totocards-backend.onrender.com/api/contacto', this.contacto).subscribe({
      next: () => {
        this.toastService.mostrar('Mensaje enviado correctamente.', 'success');
        this.estadoEnvio = '';
        this.mensajeEnviado = true;
        formulario.resetForm();
      },
      error: () => {
        this.toastService.mostrar('Hubo un error de conexión. Intenta más tarde.', 'error');
        this.estadoEnvio = '';
      }
    });
  }

  enviarOtro(): void {
    this.mensajeEnviado = false;
  }
}