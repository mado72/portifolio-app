import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  showAlert(message: string): void {
    alert(message);
  }

  showConfirm(message: string): boolean {
    return confirm(message);
  }

  showError(message: string): void {
    alert(`Error: ${message}`);
  }

  showInfo(message: string): void {
    alert(`Info: ${message}`);
  }

  showWarning(message: string): void {
    alert(`Warning: ${message}`);
  }

  showSuccess(message: string): void {
    alert(`Success: ${message}`);
  }
}
