import { TestBed } from '@angular/core/testing';
import { PoetryStoreService } from './poetry-store.service';

describe('PoetryStoreService 异文采纳', () => {
  let service: PoetryStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoetryStoreService);
    service.baselineVersionId.set('version-song');
  });

  function makeDiff(): number {
    service.updateText(service.activeVersion().text.replace('晓', '晚'));
    const indexes = service.differences();
    expect(indexes.length).toBe(1);
    return indexes[0];
  }

  it('采纳底本用字后正文更新、差异减少并记录来源', () => {
    const index = makeDiff();
    service.adoptBaselineChar(index);
    expect(service.differences().length).toBe(0);
    expect(service.activeVersion().text).toContain('春眠不觉晓');
    const records = service.activeAdoptions();
    expect(records.length).toBe(1);
    expect(records[0].previous).toBe('晚');
    expect(records[0].adopted).toBe('晓');
    expect(records[0].baselineName).toBe('宋刻本异文');
  });

  it('撤销采纳恢复原字并移除记录', () => {
    const index = makeDiff();
    service.adoptBaselineChar(index);
    const record = service.activeAdoptions()[0];
    service.undoAdoption(record.id);
    expect(service.activeAdoptions().length).toBe(0);
    expect(service.activeVersion().text).toContain('春眠不觉晚');
    expect(service.differences().length).toBe(1);
  });

  it('正文再次改动后失效的采纳记录被摘除', () => {
    const index = makeDiff();
    service.adoptBaselineChar(index);
    expect(service.activeAdoptions().length).toBe(1);
    service.updateText(service.activeVersion().text.replace('晓', '晚'));
    expect(service.activeAdoptions().length).toBe(0);
  });

  it('全局撤销回到采纳前状态', () => {
    const index = makeDiff();
    service.adoptBaselineChar(index);
    service.undo();
    expect(service.activeVersion().text).toContain('春眠不觉晚');
    expect(service.activeAdoptions().length).toBe(0);
  });

  it('无差异或底本缺字时不产生采纳', () => {
    service.adoptBaselineChar(4);
    expect(service.activeAdoptions().length).toBe(0);
    const index = makeDiff();
    service.adoptBaselineChar(index + 100);
    expect(service.activeAdoptions().length).toBe(0);
  });

  it('导出的校对稿写明每处采纳的底本来源', () => {
    const index = makeDiff();
    service.adoptBaselineChar(index);
    const copy = service.exportProofreadCopy();
    expect(copy).toContain('异文采纳记录');
    expect(copy).toContain('「晚」→「晓」');
    expect(copy).toContain('宋刻本异文');
  });
});
