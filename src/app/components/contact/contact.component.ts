import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  mensajeEnviado = false;
  estadoEnvio = '';

  async enviarMensaje(event: Event) {
    event.preventDefault();
    this.estadoEnvio = 'Enviando tu mensaje al equipo de TotoCards...';
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.estadoEnvio = '';
    this.mensajeEnviado = true;
  }
}