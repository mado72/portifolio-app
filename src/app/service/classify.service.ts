import { computed, inject, Injectable } from '@angular/core';
import { SourceService } from './source.service';
import { ClassifyType } from '../model/source.model';

@Injectable({
  providedIn: 'root'
})
export class ClassifyService {

  private sourceService = inject(SourceService);

  readonly classifiers = computed(() => {
    return Object.entries(this.sourceService.dataSource.classify()).map(([id, name]) => {
      return {
        id,
        name
      } as ClassifyType;
    });
  });

  readonly classifiersMap = computed(() => {
    return Object.fromEntries(this.classifiers().map(({ id, name }) => [id, {id, name} as ClassifyType]));
  });
  
  constructor() { }

  getClassifyByName(name: string): ClassifyType | undefined {
    return this.classifiers().find(classify => classify.name === name);
  }

  getClassifyName(id: string): string {
    return this.classifiersMap()[id]?.name || id;
  }

  addClassify(classifyName: string) {
    const { id, name } = this.sourceService.addClassify(classifyName);
    return { id, name } as ClassifyType;
  }

  updateClassify(classify: ClassifyType): void {
    this.sourceService.updateClassify(classify);
  }

  removeClassify(id: string): void {
    this.sourceService.deleteClassify(id);
  }

}
