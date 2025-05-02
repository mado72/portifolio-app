import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
  OnChanges,
  SimpleChanges,
  input
} from '@angular/core';

@Directive({
  selector: '[maskNumber]',
  standalone: true
})
export class MaskNumberDirective implements OnChanges {
  maskNumber = input<number | null>(null);
  decimals = input<number>(2);
  prefix = input<string | undefined>();
  suffix = input<string | undefined>();
  @Output() maskNumberChange = new EventEmitter<number>();

  private digitString = '';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    const maskNumber = this.maskNumber();
    if ('maskNumber' in changes && maskNumber != null && !this.isInputting) {
      const decimals = this.decimals();
      // Atualiza digitString com base no novo valor quando vem de fora
      this.digitString = Math.round(maskNumber * Math.pow(10, decimals)).toString();
      // Atualiza visualização
      this.formatViewFromDigits();
    }
  }

  private isInputting = false;

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    this.isInputting = true;

    const input: HTMLInputElement = event.target as HTMLInputElement;
    // Pega só os dígitos (exclui prefixo/sufixo)
    let raw = input.value.replace(/\D/g, '');

    // remove zeros à esquerda, mas sempre mantém pelo menos um dígito
    raw = raw.replace(/^0+/, '') || '0';

    this.digitString = raw;

    this.formatViewFromDigits();

    // Emite valor numérico "puro" para o componente
    const numeric = parseFloat(this.digitString) / Math.pow(10, this.decimals());
    this.maskNumberChange.emit(numeric);

    this.isInputting = false;
  }

  private formatViewFromDigits() {
    const decimals = this.decimals();

    let isNegative = false;
    let digitString = this.digitString;

    // Detecta e remove sinal negativo
    if (digitString.startsWith('-')) {
      isNegative = true;
      digitString = digitString.slice(1);
    }

    // Evita string vazia
    digitString = digitString.replace(/^0+/, '') || '0';

    // Preenche à esquerda para garantir casas decimais
    digitString = digitString.padStart(decimals + 1, '0');
    const intPart = digitString.slice(0, -decimals);
    const decPart = digitString.slice(-decimals);

    // Formata parte inteira
    let intFormatted = parseInt(intPart, 10).toLocaleString('pt-BR');

    // Forma o texto final
    let formatted = this.prefix() || '';
    if (isNegative) {
      formatted += '-';
    }
    formatted += intFormatted;

    if (decimals > 0) {
      formatted += ',' + decPart;
    }
    formatted += this.suffix() || '';
    this.renderer.setProperty(this.el.nativeElement, 'value', formatted);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Permite teclas de navegação, deleção etc
    if (
      event.ctrlKey ||
      event.metaKey ||
      ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'].includes(event.key)
    ) {
      return;
    }

    if (event.key === '-' && !this.digitString.startsWith('-')) {
      this.digitString = '-' + this.digitString;
      this.formatViewFromDigits();
      event.preventDefault();
      return;
    }

    // Permite apenas números
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    // Pega o texto do clipboard
    const pasted = event.clipboardData?.getData('text') ?? '';
    // Detecta sinal negativo se presente no início do texto
    const isNegative = pasted.trim().startsWith('-');
    // Extrai todos os dígitos
    let digits = pasted.replace(/\D/g, '');
    if (digits.length === 0) {
      digits = '0'; // para não ficar vazio
    }
    // Salva sinal se houver
    this.digitString = (isNegative ? '-' : '') + digits;

    this.formatViewFromDigits();

    // Gera valor numérico e emite
    const numeric = (parseFloat(digits) / Math.pow(10, this.decimals())) * (isNegative ? -1 : 1);
    this.maskNumberChange.emit(numeric);
  }
}