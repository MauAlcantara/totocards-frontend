import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  pestaniaActual: string = 'productos'; // Controla si ve la pestaña de productos o usuarios
  productos: any[] = [];
  usuarios: any[] = [];

  constructor(
    private http: HttpClient,
    private productoService: ProductoService,
    private toastService: ToastService,) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarUsuarios();
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe(datos => this.productos = datos);
  }

  cargarUsuarios(): void {
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:3000/api/admin/usuarios', { headers }).subscribe({
      next: (datos: any) => this.usuarios = datos,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  // Cambiar estado (ej: pasar de PREVENTA a DISPONIBLE) o modificar stock
  guardarCambiosProducto(producto: any, nuevoStock: string, nuevoEstado: string): void {
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = {
      stock: parseInt(nuevoStock),
      estado: nuevoEstado,
      precio: producto.precio
    };

    this.http.put(`http://localhost:3000/api/admin/productos/${producto.id_producto}`, payload, { headers }).subscribe({
      next: (res: any) => {
        this.toastService.mostrar('Inventario actualizado correctamente.', 'success');
        this.cargarProductos(); // Recargamos la lista
      },
      error: (err) => {
        this.toastService.mostrar('Error al guardar los cambios.', 'error');
      }
    });
  }

  toggleEstadoUsuario(usuario: any): void {
    const nuevoEstado = !usuario.activo; // Si está true lo pasa a false, y viceversa
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`http://localhost:3000/api/admin/usuarios/${usuario.id_usuario}/estado`, { activo: nuevoEstado }, { headers })
      .subscribe({
        next: (res: any) => {
          this.toastService.mostrar(res.mensaje, nuevoEstado ? 'success' : 'info');
          this.cargarUsuarios(); // Recargamos la tabla para ver el cambio de color
        },
        error: (err) => this.toastService.mostrar('Error al cambiar el estado', 'error')
      });
  }
}