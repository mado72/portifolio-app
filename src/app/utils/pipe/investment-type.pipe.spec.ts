import { InvestmentTypePipe } from './investment-type.pipe';
import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';

describe('InvestmentTypePipe', () => {
  let pipe: InvestmentTypePipe;

  beforeEach(() => {
    pipe = new InvestmentTypePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  // Definir todos os valores de enum para testar
  const investmentTypes = [
    InvestmentEnum.BUY,
    InvestmentEnum.SELL,
    InvestmentEnum.DIVIDENDS,
    InvestmentEnum.RENT_RETURN,
    InvestmentEnum.IOE_RETURN,
    InvestmentEnum.TRANSFER,
    InvestmentEnum.SUBSCRIPTION,
    InvestmentEnum.REDEMPTION,
    InvestmentEnum.OTHER
  ];

  // Mapeamento de enum para abreviações esperadas
  const expectedAbbreviations: Record<InvestmentEnum, string> = {
    [InvestmentEnum.BUY]: 'C',
    [InvestmentEnum.SELL]: 'V',
    [InvestmentEnum.DIVIDENDS]: 'Dvds',
    [InvestmentEnum.RENT_RETURN]: 'Alg',
    [InvestmentEnum.IOE_RETURN]: 'JCP',
    [InvestmentEnum.TRANSFER]: 'Trnsf',
    [InvestmentEnum.SUBSCRIPTION]: 'Subs',
    [InvestmentEnum.REDEMPTION]: 'Rsgt',
    [InvestmentEnum.OTHER]: 'Otrs'
  };

  describe('transform with enum values', () => {
    investmentTypes.forEach(type => {
      it(`should return full description for ${InvestmentEnum[type]} enum value`, () => {
        const result = pipe.transform(type);
        expect(result).toBe(InvestmentEnumDesc[type]);
      });
    });
  });

  describe('transform with string values', () => {
    investmentTypes.forEach(type => {
      const typeString = InvestmentEnum[type];
      it(`should return full description for "${typeString}" string value`, () => {
        const result = pipe.transform(typeString);
        expect(result).toBe(InvestmentEnumDesc[type]);
      });
    });
  });

  describe('transform with "short" argument', () => {
    investmentTypes.forEach(type => {
      it(`should return abbreviated form for ${InvestmentEnum[type]} enum value`, () => {
        const result = pipe.transform(type, 'short');
        expect(result).toBe(expectedAbbreviations[type]);
      });
    });
  });

  describe('transform with string values and "short" argument', () => {
    investmentTypes.forEach(type => {
      const typeString = InvestmentEnum[type];
      it(`should return abbreviated form for "${typeString}" string value`, () => {
        const result = pipe.transform(typeString, 'short');
        expect(result).toBe(expectedAbbreviations[type]);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty args array', () => {
      const result = pipe.transform(InvestmentEnum.BUY);
      expect(result).toBe(InvestmentEnumDesc[InvestmentEnum.BUY]);
    });

    it('should handle undefined args', () => {
      const result = pipe.transform(InvestmentEnum.BUY, undefined as any);
      expect(result).toBe(InvestmentEnumDesc[InvestmentEnum.BUY]);
    });

    it('should handle non-"short" args', () => {
      const result = pipe.transform(InvestmentEnum.BUY, 'long');
      expect(result).toBe(InvestmentEnumDesc[InvestmentEnum.BUY]);
    });

    it('should handle case sensitivity in args', () => {
      const result = pipe.transform(InvestmentEnum.BUY, 'SHORT');
      expect(result).toBe(InvestmentEnumDesc[InvestmentEnum.BUY]);
    });

  });

  // Teste para verificar a conversão de string para enum
  describe('string to enum conversion', () => {
    it('should convert string to enum correctly', () => {
      // Criar um spy para InvestmentEnum
      const result = pipe.transform('BUY');
      
      // Verificar se a propriedade foi acessada
      expect(result).toBe('Compra');
    });
  });
});