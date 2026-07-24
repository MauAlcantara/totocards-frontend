import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { ContactComponent } from './components/contact/contact.component';
import { PreventasComponent } from './components/preventas/preventas.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { authGuard } from './guards/auth.guard';
import { RegistroComponent } from './components/registro/registro.component';
import { LoginComponent } from './components/login/login.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { AdminComponent } from './components/admin/admin.component';
import { adminGuard } from './guards/admin.guard';
import { PrivacidadComponent } from './components/privacidad/privacidad.component';
import { TerminosComponent } from './components/terminos/terminos.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },             
  { path: 'catalogo', component: CatalogComponent },   
  { path: 'contacto', component: ContactComponent },
  { path: 'preventas', component: PreventasComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] }, 
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'login', component: LoginComponent },       
  { path: 'registro', component: RegistroComponent },
  { path: 'privacidad', component: PrivacidadComponent },
  { path: 'terminos', component: TerminosComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'pedidos', component: PedidosComponent },
  { path: '**', redirectTo: '' }              
];