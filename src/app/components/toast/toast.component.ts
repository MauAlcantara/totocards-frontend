import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit {
  mensaje: ToastMessage | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState$.subscribe(msg => {
      this.mensaje = msg;
    });
  }

  cerrar(): void {
    this.toastService.ocultar();
  }
}