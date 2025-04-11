import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';
import { InvestmentTypePipe } from './investment-type.pipe';

describe('InvestmentTypePipe', () => {
  it('create an instance', () => {
    const pipe = new InvestmentTypePipe();
    expect(pipe).toBeTruthy();
  });

  it('should transform InvestmentEnum value to its corresponding description', () => {
    const pipe = new InvestmentTypePipe();
    const mockEnumValue = InvestmentEnum.DIVIDENDS;
    const mockEnumDescription = InvestmentEnumDesc.DIVIDENDS;

    // Mock the InvestmentEnumDesc object
    jest.spyOn(InvestmentEnumDesc, 'DIVIDENDS', 'get').mockReturnValue(mockEnumDescription);

    const result = pipe.transform(mockEnumValue);
    expect(result).toBe(mockEnumDescription);
  });

});
