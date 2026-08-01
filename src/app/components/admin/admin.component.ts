import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  pestaniaActual: string = 'productos'; 
  productos: any[] = [];
  usuarios: any[] = [];

  // Variables CRUD Productos
  mostrarModalProducto: boolean = false;
  modoEdicion: boolean = false;
  productoActual: any = this.obtenerProductoVacio();
  mostrarModalEliminar: boolean = false;
  productoAEliminar: any = null;

  // 🔥 NUEVAS Variables CRUD Usuarios
  mostrarModalUsuario: boolean = false;
  modoEdicionUsuario: boolean = false;
  usuarioActual: any = this.obtenerUsuarioVacio();
  mostrarModalEliminarUsuario: boolean = false;
  usuarioAEliminar: any = null;

  constructor(
    private http: HttpClient,
    private productoService: ProductoService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarUsuarios();
  }

  // ==========================================
  // GESTIÓN DE PRODUCTOS (CRUD)
  // ==========================================
  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe(datos => this.productos = datos);
  }

  obtenerProductoVacio() {
    return {
      nombre: '', descripcion: '', precio: 0, stock: 0,
      categoria: 'Sobres', expansion: '', imagen_url: '',
      estado: 'DISPONIBLE', fecha_lanzamiento: null
    };
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.productoActual = this.obtenerProductoVacio();
    this.mostrarModalProducto = true;
  }

  abrirModalEditar(producto: any): void {
    this.modoEdicion = true;
    this.productoActual = { ...producto }; 
    if (this.productoActual.fecha_lanzamiento) {
      this.productoActual.fecha_lanzamiento = new Date(this.productoActual.fecha_lanzamiento).toISOString().split('T')[0];
    }
    this.mostrarModalProducto = true;
  }

  cerrarModalProducto(): void { this.mostrarModalProducto = false; }

  guardarProducto(): void {
    const token = localStorage.getItem('tototoken') || '';
    if (this.modoEdicion) {
      this.productoService.actualizarProducto(this.productoActual.id_producto, this.productoActual, token).subscribe({
          next: () => { this.toastService.mostrar('Producto actualizado.', 'success'); this.cargarProductos(); this.cerrarModalProducto(); },
          error: () => this.toastService.mostrar('Error al actualizar.', 'error')
        });
    } else {
      this.productoService.crearProducto(this.productoActual, token).subscribe({
          next: () => { this.toastService.mostrar('Producto agregado.', 'success'); this.cargarProductos(); this.cerrarModalProducto(); },
          error: () => this.toastService.mostrar('Error al crear.', 'error')
        });
    }
  }

  abrirModalEliminar(producto: any): void { this.productoAEliminar = producto; this.mostrarModalEliminar = true; }
  cerrarModalEliminar(): void { this.mostrarModalEliminar = false; this.productoAEliminar = null; }

  eliminarProductoConfirmado(): void {
    if (!this.productoAEliminar) return;
    const token = localStorage.getItem('tototoken') || '';
    this.productoService.eliminarProducto(this.productoAEliminar.id_producto, token).subscribe({
      next: (res: any) => { this.toastService.mostrar(res.mensaje, 'success'); this.cargarProductos(); this.cerrarModalEliminar(); },
      error: (err: any) => { this.toastService.mostrar(err.error?.mensaje, 'error'); this.cerrarModalEliminar(); }
    });
  }

  // ==========================================
  // 🔥 GESTIÓN DE USUARIOS (CRUD COMPLETADO)
  // ==========================================
  cargarUsuarios(): void {
    const token = localStorage.getItem('tototoken') || '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://totocards-backend.onrender.com/api/admin/usuarios', { headers }).subscribe({
      next: (datos: any) => this.usuarios = datos,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  obtenerUsuarioVacio() {
    return { nombre: '', email: '', password: '', rol: 'Usuario' };
  }

  abrirModalCrearUsuario(): void {
    this.modoEdicionUsuario = false;
    this.usuarioActual = this.obtenerUsuarioVacio();
    this.mostrarModalUsuario = true;
  }

  abrirModalEditarUsuario(usuario: any): void {
    this.modoEdicionUsuario = true;
    this.usuarioActual = { ...usuario, password: '' }; // No cargamos la contraseña por seguridad
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void { this.mostrarModalUsuario = false; }

  guardarUsuario(): void {
    const token = localStorage.getItem('tototoken') || '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.modoEdicionUsuario) {
      this.http.put(`https://totocards-backend.onrender.com/api/admin/usuarios/${this.usuarioActual.id_usuario}`, this.usuarioActual, { headers })
        .subscribe({
          next: (res: any) => { this.toastService.mostrar('Usuario actualizado.', 'success'); this.cargarUsuarios(); this.cerrarModalUsuario(); },
          error: (err: any) => this.toastService.mostrar(err.error?.mensaje || 'Error al actualizar', 'error')
        });
    } else {
      this.http.post(`https://totocards-backend.onrender.com/api/admin/usuarios`, this.usuarioActual, { headers })
        .subscribe({
          next: (res: any) => { this.toastService.mostrar('Usuario registrado.', 'success'); this.cargarUsuarios(); this.cerrarModalUsuario(); },
          error: (err: any) => this.toastService.mostrar(err.error?.mensaje || 'Error al crear', 'error')
        });
    }
  }

  abrirModalEliminarUsuario(usuario: any): void { this.usuarioAEliminar = usuario; this.mostrarModalEliminarUsuario = true; }
  cerrarModalEliminarUsuario(): void { this.mostrarModalEliminarUsuario = false; this.usuarioAEliminar = null; }

  eliminarUsuarioConfirmado(): void {
    if (!this.usuarioAEliminar) return;
    const token = localStorage.getItem('tototoken') || '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`https://totocards-backend.onrender.com/api/admin/usuarios/${this.usuarioAEliminar.id_usuario}`, { headers })
      .subscribe({
        next: (res: any) => { this.toastService.mostrar(res.mensaje, 'success'); this.cargarUsuarios(); this.cerrarModalEliminarUsuario(); },
        error: (err: any) => { this.toastService.mostrar(err.error?.mensaje, 'error'); this.cerrarModalEliminarUsuario(); }
      });
  }

  toggleEstadoUsuario(usuario: any): void {
    const nuevoEstado = !usuario.activo; 
    const token = localStorage.getItem('tototoken') || '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`https://totocards-backend.onrender.com/api/admin/usuarios/${usuario.id_usuario}/estado`, { activo: nuevoEstado }, { headers })
      .subscribe({
        next: (res: any) => { this.toastService.mostrar(res.mensaje, nuevoEstado ? 'success' : 'info'); this.cargarUsuarios(); },
        error: () => this.toastService.mostrar('Error al cambiar el estado', 'error')
      });
  }
}