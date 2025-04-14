import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, LOCALE_ID, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { ExchangeStructureType } from '../../../model/investment.model';

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    DecimalPipe
  ],
  templateUrl: './exchange.component.html',
  styleUrl: './exchange.component.scss'
})
/**
 * The `ExchangeComponent` is a utility component designed to handle and display
 * exchange-related data. It provides functionality to toggle between original
 * and exchanged values, compute derived values, and manage display states.
 *
 * Properties:
 * - `faExchange`: A readonly reference to the FontAwesome exchange icon.
 * - `decimalPipe`: A private instance of `DecimalPipe` for formatting numeric values.
 * - `exchange`: An input property that accepts an `ExchangeStructureType`, `null`, or `undefined`.
 * - `display`: An input property that determines the display mode, which can be `"original"`, `"exchanged"`, or `null`.
 * - `exchangeDisplay`: A reactive signal that tracks the current display mode, defaulting to `"exchanged"`.
 * - `hideIcon`: An input property that determines whether the exchange icon should be hidden.
 * - `value`: A computed property that returns the value of the currently selected display mode (`"original"` or `"exchanged"`).
 * - `other`: A computed property that returns the value of the opposite display mode.
 * - `displayChanged`: A subscription to the `display` input property, updating `exchangeDisplay` when `display` changes.
 * - `iconTitle`: A computed property that generates a title for the exchange icon, combining the currency and formatted value of the opposite display mode.
 *
 * Methods:
 * - `toggle()`: Toggles the `exchangeDisplay` between `"original"` and `"exchanged"`.
 */
export class ExchangeComponent {

  readonly faExchange = faExchange;

  private decimalPipe = new DecimalPipe(inject(LOCALE_ID));

  /**
   * Represents an exchange input that can hold a value of type `ExchangeStructureType`,
   * `null`, or `undefined`. It is initialized with a default value of `null`.
   *
   * @type {ExchangeStructureType | null | undefined}
   */
  exchange = input<ExchangeStructureType| null | undefined>(null);

  /**
   * Represents the current display state of the component.
   * It can be one of the following values:
   * - `"original"`: Indicates the original state.
   * - `"exchanged"`: Indicates the exchanged state.
   * - `null`: Indicates no state is currently set.
   */
  display = input<"original" | "exchanged" | null>(null);

  /**
   * A reactive signal that represents the current display state of the exchange component.
   * It can have one of two possible string values:
   * - `"original"`: Indicates the original state is being displayed.
   * - `"exchanged"`: Indicates the exchanged state is being displayed.
   */
  exchangeDisplay = signal<"original" | "exchanged">("exchanged");

  /**
   * A boolean input property that determines whether the icon should be hidden.
   * Defaults to `false`.
   */
  hideIcon = input<boolean>(false);

  /**
   * A computed property that retrieves a specific value from the exchange object
   * based on the current display key. If the exchange object is not available,
   * it returns `null`.
   *
   * @returns {any | null} The value from the exchange object corresponding to the
   * current display key, or `null` if the exchange object is not defined.
   */
  value = computed(()=> {
    const exchange = this.exchange();
    if (!exchange) {
      return null;
    }
    const display = this.exchangeDisplay() as keyof ExchangeStructureType;
    return exchange[display];
  });

  /**
   * A computed property that determines the "other" value based on the current exchange state.
   * It checks the current exchange object and toggles between "original" and "exchanged" display modes.
   * 
   * @returns The value of the exchange in the opposite display mode, or `null` if no exchange is available.
   */
  other = computed(()=> {
    const exchange = this.exchange();
    if (!exchange) {
      return null;
    }
    const display = this.exchangeDisplay() === "original" ? "exchanged" : "original";
    return exchange[display];
  });

  /**
   * Subscribes to changes in the `display` observable and updates the `exchangeDisplay` 
   * with the new value whenever it changes.
   *
   * @remarks
   * This subscription listens for changes in the `display` observable. When a new value 
   * is emitted, it checks if the value is truthy and then sets it in the `exchangeDisplay`.
   *
   * @example
   * // Assuming `display` is an observable emitting values:
   * displayChanged = toObservable(this.display).subscribe(value => {
   *   if (value) {
   *     this.exchangeDisplay.set(value);
   *   }
   * });
   */
  displayChanged = toObservable(this.display).subscribe(value=>{
    if (value)
      this.exchangeDisplay.set(value);
  })

  /**
   * Toggles the state of the exchange display between "original" and "exchanged".
   * Updates the `exchangeDisplay` property by switching its value based on the current state.
   */
  toggle() {
    this.exchangeDisplay.update(exchange => exchange === "original" ? "exchanged" : "original");
  }

  /**
   * A computed property that generates a formatted string combining the currency and value
   * from the `other` observable. The value is formatted using the `DecimalPipe` with a 
   * precision of 1.2-2 (minimum 1 integer digit, minimum 2 fraction digits, and maximum 2 fraction digits).
   *
   * @returns A string in the format: "<currency> <formatted value>", or `undefined` if `other` is null or undefined.
   */
  iconTitle = computed(() => this.other()?.currency + ' ' + this.decimalPipe.transform(this.other()?.value, "1.2-2"))

}
