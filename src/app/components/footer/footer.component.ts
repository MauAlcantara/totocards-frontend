import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
    imports: [
    RouterLink
  ], 
})
export class FooterComponent {
  anioActual: number = new Date().getFullYear();
}