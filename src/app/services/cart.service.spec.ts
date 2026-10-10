import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService (QA Test Suite)', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.limpiarCarrito();
  });

  it('debe crearse correctamente el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debe agregar un producto correctamente al carrito', () => {
    const producto = {
      id_producto: 1,
      nombre: 'Booster Pack Stellar Crown',
      precio: 120,
      stock: 10,
      estado: 'DISPONIBLE'
    };

    service.agregarAlCarrito(producto, 2);
    const carrito = service.obtenerCarrito();

    expect(carrito.length).toBe(1);
    expect(carrito[0].cantidad).toBe(2);
    expect(carrito[0].precio_unitario).toBe(120);
  });

  it('debe respetar el límite de 2 unidades en productos de PREVENTA', () => {
    const preventa = {
      id_producto: 2,
      nombre: 'Preventa Elite Trainer Box Surging Sparks',
      precio: 1350,
      stock: 20,
      estado: 'PREVENTA'
    };

    // Intentar agregar 3 unidades
    service.agregarAlCarrito(preventa, 3);
    let carrito = service.obtenerCarrito();
    expect(carrito[0].cantidad).toBe(2);

    // Intentar agregar otra unidad más
    service.agregarAlCarrito(preventa, 1);
    carrito = service.obtenerCarrito();
    expect(carrito[0].cantidad).toBe(2);
  });

  it('debe eliminar artículos y limpiar el carrito', () => {
    const producto = {
      id_producto: 5,
      nombre: 'Mazo de Batalla Deluxe',
      precio: 450,
      stock: 5,
      estado: 'DISPONIBLE'
    };

    service.agregarAlCarrito(producto, 1);
    expect(service.obtenerCarrito().length).toBe(1);

    service.eliminarDelCarrito(5);
    expect(service.obtenerCarrito().length).toBe(0);
  });
});
