// test-helpers.ts
// Versão tipada para TypeScript
export function createSpyObj<T>(
    baseName: string, 
    methodNames: Array<keyof T>, 
    methodsDef?: Partial<Record<keyof T, jest.Mock>>): { [K in keyof T]: jest.Mock & T[K]} {

  const obj: any = {};
  
  for (const method of methodNames) {
    obj[method] = methodsDef?.[method] || jest.fn();
  }
  
  return obj as { [K in keyof T]: jest.Mock & T[K] };
}

// Definição de tipo para objetos espiões no Jest
export type JestSpyObj<T> = {
  [K in keyof T]: jest.Mock & T[K];
};
