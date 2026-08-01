import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🔥 CRÍTICO: Necesario para los formularios [(ngModel)]
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule], // 🔥 Asegúrate de agregarlo aquí
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  pestaniaActual: string = 'productos'; 
  productos: any[] = [];
  usuarios: any[] = [];

  // 🔥 Variables para el Modal del CRUD
  mostrarModalProducto: boolean = false;
  modoEdicion: boolean = false;
  productoActual: any = this.obtenerProductoVacio();

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
    this.productoActual = { ...producto }; // Clonamos para no editar la tabla en vivo hasta darle guardar
    
    // Si tiene fecha, la ajustamos para el input type="date"
    if (this.productoActual.fecha_lanzamiento) {
      this.productoActual.fecha_lanzamiento = new Date(this.productoActual.fecha_lanzamiento).toISOString().split('T')[0];
    }
    this.mostrarModalProducto = true;
  }

  cerrarModalProducto(): void {
    this.mostrarModalProducto = false;
  }

  guardarProducto(): void {
    const token = localStorage.getItem('tototoken') || '';
    
    if (this.modoEdicion) {
      // ✏️ ACTUALIZAR
      this.productoService.actualizarProducto(this.productoActual.id_producto, this.productoActual, token)
        .subscribe({
          next: () => {
            this.toastService.mostrar('Producto actualizado correctamente.', 'success');
            this.cargarProductos();
            this.cerrarModalProducto();
          },
          error: () => this.toastService.mostrar('Error al actualizar el producto.', 'error')
        });
    } else {
      // ➕ CREAR
      this.productoService.crearProducto(this.productoActual, token)
        .subscribe({
          next: () => {
            this.toastService.mostrar('Producto agregado al catálogo.', 'success');
            this.cargarProductos();
            this.cerrarModalProducto();
          },
          error: () => this.toastService.mostrar('Error al crear el producto.', 'error')
        });
    }
  }

  eliminarProducto(id: number): void {
    if (confirm('⚠️ ¿Estás seguro de eliminar este producto? Esta acción es irreversible.')) {
      const token = localStorage.getItem('tototoken') || '';
      this.productoService.eliminarProducto(id, token).subscribe({
        next: () => {
          this.toastService.mostrar('Producto eliminado.', 'success');
          this.cargarProductos();
        },
        error: () => this.toastService.mostrar('No se puede borrar porque hay compras ligadas a él.', 'error')
      });
    }
  }

  // ==========================================
  // GESTIÓN DE USUARIOS
  // ==========================================
  cargarUsuarios(): void {
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://totocards-backend.onrender.com/api/admin/usuarios', { headers }).subscribe({
      next: (datos: any) => this.usuarios = datos,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  toggleEstadoUsuario(usuario: any): void {
    const nuevoEstado = !usuario.activo; 
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`https://totocards-backend.onrender.com/api/admin/usuarios/${usuario.id_usuario}/estado`, { activo: nuevoEstado }, { headers })
      .subscribe({
        next: (res: any) => {
          this.toastService.mostrar(res.mensaje, nuevoEstado ? 'success' : 'info');
          this.cargarUsuarios(); 
        },
        error: () => this.toastService.mostrar('Error al cambiar el estado', 'error')
      });
  }
}