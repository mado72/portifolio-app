import { AssetCodePipe } from '../utils/asset-code.pipe';

describe('AssetCodePipe', () => {
  it('create an instance', () => {
    const pipe = new AssetCodePipe();
    expect(pipe).toBeTruthy();
  });
});
