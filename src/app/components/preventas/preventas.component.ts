import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-preventas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preventas.component.html',
  styleUrls: ['./preventas.component.css']
})
export class PreventasComponent implements OnInit {
  preventas: any[] = [];

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.productoService.obtenerPreventas().subscribe({
      next: (datos) => {
        this.preventas = datos;
      },
      error: (err) => console.error('Error cargando preventas', err)
    });
  }
}