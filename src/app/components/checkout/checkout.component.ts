import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { CartService } from '../../services/cart.service'; 
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { WearableService } from '../../services/wearable.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  carrito: any[] = [];
  subtotal: number = 0;
  descuentoEtb: number = 0;
  costoEnvio: number = 0;
  envioGratisVerano: boolean = false;
  total: number = 0;

  metodoPagoSeleccionado: 'tarjeta' | 'paypal' | 'spei' = 'tarjeta';

  checkoutForm: FormGroup;
  cargando: boolean = false;
  compraCompletada: boolean = false;
  codigoOrden: string = '';
  mensajeServidor: string = '';

  estadosMexico: string[] = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService, 
    private cartService: CartService, 
    private toastService: ToastService,
    private authService: AuthService,
    private wearableService: WearableService,
    private router: Router
  ) {
    const usuario = this.authService.obtenerUsuarioActual();

    this.checkoutForm = this.fb.group({
      // Datos de Envío
      nombreCompleto: [usuario?.nombre || '', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9\s+-]{10,15}$/)]],
      calleNumero: ['', [Validators.required, Validators.minLength(5)]],
      colonia: ['', [Validators.required, Validators.minLength(3)]],
      ciudad: ['', [Validators.required, Validators.minLength(2)]],
      estado: ['Ciudad de México', [Validators.required]],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      instruccionesEntrega: [''],

      // Datos de Tarjeta
      numeroTarjeta: ['4532 8921 4092 1144', [Validators.required]],
      nombreTitular: [usuario?.nombre || 'ASH KETCHUM', [Validators.required]],
      fechaExpira: ['08/28', [Validators.required]],
      cvv: ['742', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cartService.carrito$.subscribe(items => {
      this.carrito = items;
      this.calcularTotal();
    });
  }

  calcularTotal(): void {
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();

    // Viernes (5), Sábado (6) o Domingo (0)
    const esFinDeSemana = (diaSemana === 5 || diaSemana === 6 || diaSemana === 0);
    
    // Festival de Verano: Junio (mes 5), Julio (mes 6) y Agosto (mes 7) de cada año
    this.envioGratisVerano = (mesActual >= 5 && mesActual <= 7);

    this.subtotal = 0;
    this.descuentoEtb = 0;

    this.carrito.forEach(item => {
      this.subtotal += (item.precio_unitario * item.cantidad);

      if (esFinDeSemana && item.nombre && item.nombre.toLowerCase().includes('elite trainer box')) {
        this.descuentoEtb += (item.precio_unitario * 0.10) * item.cantidad; 
      }
    });

    this.costoEnvio = this.envioGratisVerano ? 0 : 150.00; 
    this.total = Math.max(0, this.subtotal - this.descuentoEtb + this.costoEnvio);
  }

  seleccionarMetodo(metodo: 'tarjeta' | 'paypal' | 'spei'): void {
    this.metodoPagoSeleccionado = metodo;
  }

  quitarItem(id_producto: number): void {
    this.cartService.eliminarDelCarrito(id_producto);
    this.toastService.mostrar('Artículo removido del pedido.', 'info');
  }

  aumentarCantidad(item: any): void {
    const maximo = item.estado === 'PREVENTA' ? 2 : item.stock;
    if (item.cantidad < maximo) {
      this.cartService.agregarAlCarrito(item, 1);
    } else {
      this.toastService.mostrar(`Límite máximo alcanzado para este producto (${maximo}).`, 'error');
    }
  }

  disminuirCantidad(item: any): void {
    if (item.cantidad > 1) {
      this.cartService.agregarAlCarrito(item, -1);
    } else {
      this.quitarItem(item.id_producto);
    }
  }

  pagar(): void {
    if (this.carrito.length === 0) {
      this.toastService.mostrar('Tu carrito está vacío.', 'error');
      return;
    }

    // Validar campos de envío
    const camposEnvio = ['nombreCompleto', 'telefono', 'calleNumero', 'colonia', 'ciudad', 'estado', 'codigoPostal'];
    let envioInvalido = false;

    camposEnvio.forEach(campo => {
      const control = this.checkoutForm.get(campo);
      if (control && control.invalid) {
        control.markAsTouched();
        envioInvalido = true;
      }
    });

    if (envioInvalido) {
      this.toastService.mostrar('Por favor completa todos los datos obligatorios de envío.', 'error');
      return;
    }

    // Validar tarjeta si ese es el método
    if (this.metodoPagoSeleccionado === 'tarjeta') {
      const camposTarjeta = ['numeroTarjeta', 'nombreTitular', 'fechaExpira', 'cvv'];
      let tarjetaInvalida = false;
      camposTarjeta.forEach(campo => {
        const control = this.checkoutForm.get(campo);
        if (control && control.invalid) {
          control.markAsTouched();
          tarjetaInvalida = true;
        }
      });

      if (tarjetaInvalida) {
        this.toastService.mostrar('Verifica los datos de tu tarjeta bancaria.', 'error');
        return;
      }
    }

    this.cargando = true;
    this.mensajeServidor = '';

    const payload = {
      items: this.carrito.map(it => ({ id_producto: it.id_producto, cantidad: it.cantidad })),
      total: this.total,
      datos_envio: {
        destinatario: this.checkoutForm.value.nombreCompleto,
        telefono: this.checkoutForm.value.telefono,
        direccion: `${this.checkoutForm.value.calleNumero}, Col. ${this.checkoutForm.value.colonia}`,
        ciudad: this.checkoutForm.value.ciudad,
        estado: this.checkoutForm.value.estado,
        cp: this.checkoutForm.value.codigoPostal,
        notas: this.checkoutForm.value.instruccionesEntrega
      },
      metodo_pago: this.metodoPagoSeleccionado
    };

    this.pedidoService.procesarCheckout(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.compraCompletada = true;
        this.codigoOrden = res.codigo_orden || `TCG-${String(res.id_pedido).padStart(4, '0')}`;
        this.toastService.mostrar('¡Compra asegurada con éxito!', 'success');
        this.cartService.limpiarCarrito();

        // Notificación automática al Smartwatch Wear OS y Gemelo Digital
        this.wearableService.enviarNotificacionWearable(
          '¡Compra Exitosa!',
          `Orden #${this.codigoOrden} por $${this.total.toFixed(2)}`,
          'compra'
        ).subscribe({ error: () => {} });
      },
      error: (err) => {
        this.cargando = false;
        const msgError = err.error?.mensaje || 'Hubo un inconveniente al procesar tu compra en el servidor.';
        this.mensajeServidor = msgError;
        this.toastService.mostrar(msgError, 'error');
      }
    });
  }
}