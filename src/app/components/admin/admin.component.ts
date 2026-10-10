import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ProductoService } from '../../services/producto.service';
import { AdminService } from '../../services/admin.service';
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
  
  // Arreglos de datos
  productos: any[] = [];
  usuarios: any[] = [];
  mensajes: any[] = []; 

  // Modales Producto
  mostrarModalProducto: boolean = false;
  modoEdicion: boolean = false;
  productoActual: any = this.obtenerProductoVacio();
  mostrarModalEliminar: boolean = false;
  productoAEliminar: any = null;

  // Modales Usuario
  mostrarModalUsuario: boolean = false;
  modoEdicionUsuario: boolean = false;
  usuarioActual: any = this.obtenerUsuarioVacio();
  mostrarModalEliminarUsuario: boolean = false;
  usuarioAEliminar: any = null;

  // Modales Mensajes
  mostrarModalMensaje: boolean = false;
  mensajeSeleccionado: any = null;

  constructor(
    private productoService: ProductoService,
    private adminService: AdminService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarUsuarios();
    this.cargarMensajes(); 
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.cerrarModalProducto();
    this.cerrarModalEliminar();
    this.cerrarModalUsuario();
    this.cerrarModalEliminarUsuario();
    this.cerrarModalMensaje();
  }

  // ==========================================
  // PRODUCTOS
  // ==========================================
  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => this.productos = datos,
      error: () => this.toastService.mostrar('Error al cargar catálogo de productos.', 'error')
    });
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
    if (this.modoEdicion) {
      this.productoService.actualizarProducto(this.productoActual.id_producto, this.productoActual).subscribe({
        next: () => { 
          this.toastService.mostrar('Producto actualizado.', 'success'); 
          this.cargarProductos(); 
          this.cerrarModalProducto(); 
        },
        error: () => this.toastService.mostrar('Error al actualizar producto.', 'error')
      });
    } else {
      this.productoService.crearProducto(this.productoActual).subscribe({
        next: () => { 
          this.toastService.mostrar('Producto agregado exitosamente.', 'success'); 
          this.cargarProductos(); 
          this.cerrarModalProducto(); 
        },
        error: () => this.toastService.mostrar('Error al crear producto.', 'error')
      });
    }
  }

  abrirModalEliminar(producto: any): void { this.productoAEliminar = producto; this.mostrarModalEliminar = true; }
  cerrarModalEliminar(): void { this.mostrarModalEliminar = false; this.productoAEliminar = null; }

  eliminarProductoConfirmado(): void {
    if (!this.productoAEliminar) return;
    this.productoService.eliminarProducto(this.productoAEliminar.id_producto).subscribe({
      next: (res: any) => { 
        this.toastService.mostrar(res.mensaje || 'Producto eliminado.', 'success'); 
        this.cargarProductos(); 
        this.cerrarModalEliminar(); 
      },
      error: (err: any) => { 
        this.toastService.mostrar(err.error?.mensaje || 'Error al eliminar producto.', 'error'); 
        this.cerrarModalEliminar(); 
      }
    });
  }

  // ==========================================
  // USUARIOS
  // ==========================================
  cargarUsuarios(): void {
    this.adminService.obtenerUsuarios().subscribe({
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
    this.usuarioActual = { ...usuario, password: '' }; 
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void { this.mostrarModalUsuario = false; }

  guardarUsuario(): void {
    if (this.modoEdicionUsuario) {
      this.adminService.actualizarUsuario(this.usuarioActual.id_usuario, this.usuarioActual)
        .subscribe({
          next: () => { 
            this.toastService.mostrar('Usuario actualizado.', 'success'); 
            this.cargarUsuarios(); 
            this.cerrarModalUsuario(); 
          },
          error: (err: any) => this.toastService.mostrar(err.error?.mensaje || 'Error al actualizar usuario', 'error')
        });
    } else {
      this.adminService.crearUsuario(this.usuarioActual)
        .subscribe({
          next: () => { 
            this.toastService.mostrar('Usuario registrado.', 'success'); 
            this.cargarUsuarios(); 
            this.cerrarModalUsuario(); 
          },
          error: (err: any) => this.toastService.mostrar(err.error?.mensaje || 'Error al crear usuario', 'error')
        });
    }
  }

  abrirModalEliminarUsuario(usuario: any): void { this.usuarioAEliminar = usuario; this.mostrarModalEliminarUsuario = true; }
  cerrarModalEliminarUsuario(): void { this.mostrarModalEliminarUsuario = false; this.usuarioAEliminar = null; }

  eliminarUsuarioConfirmado(): void {
    if (!this.usuarioAEliminar) return;
    this.adminService.eliminarUsuario(this.usuarioAEliminar.id_usuario)
      .subscribe({
        next: (res: any) => { 
          this.toastService.mostrar(res.mensaje || 'Usuario eliminado.', 'success'); 
          this.cargarUsuarios(); 
          this.cerrarModalEliminarUsuario(); 
        },
        error: (err: any) => { 
          this.toastService.mostrar(err.error?.mensaje || 'Error al eliminar usuario.', 'error'); 
          this.cerrarModalEliminarUsuario(); 
        }
      });
  }

  toggleEstadoUsuario(usuario: any): void {
    const nuevoEstado = !usuario.activo; 
    this.adminService.cambiarEstadoUsuario(usuario.id_usuario, nuevoEstado)
      .subscribe({
        next: (res: any) => { 
          this.toastService.mostrar(res.mensaje || 'Estado modificado.', nuevoEstado ? 'success' : 'info'); 
          this.cargarUsuarios(); 
        },
        error: () => this.toastService.mostrar('Error al cambiar el estado del usuario', 'error')
      });
  }

  // ==========================================
  // MENSAJES
  // ==========================================
  cargarMensajes(): void {
    this.adminService.obtenerMensajes().subscribe({
      next: (datos: any) => this.mensajes = datos,
      error: () => console.error('Error al cargar la bandeja')
    });
  }

  abrirModalMensaje(msg: any): void {
    this.mensajeSeleccionado = msg;
    this.mostrarModalMensaje = true;

    if (!msg.leido) {
      this.adminService.marcarMensajeLeido(msg.id_mensaje)
        .subscribe(() => {
          msg.leido = true;
        });
    }
  }

  cerrarModalMensaje(): void {
    this.mostrarModalMensaje = false;
    this.mensajeSeleccionado = null;
  }
}