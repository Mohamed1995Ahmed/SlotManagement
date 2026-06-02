import { Routes } from '@angular/router';
import { SlotsComponent } from './slots/slots.component';

export const routes: Routes = [
  { path: '', component: SlotsComponent },
  { path: '**', redirectTo: '' }
];
