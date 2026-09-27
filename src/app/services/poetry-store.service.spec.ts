import { TestBed } from '@angular/core/testing';
import { PoetryStoreService } from './poetry-store.service';

describe('PoetryStoreService 底本采纳', () => {
  let store: PoetryStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PoetryStoreService);
    store.baselineVersionId.set('version-song');
  });

  function makeDifference(): void {
    // 底本第 5 字为“晓”，把当前稿改成“小”，制造一处异文
    store.updateText('春眠不觉小，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。');
  }

  it('采纳底本用字后正文同步更新、差异数减少并留下带来源的记录', () => {
    makeDifference();
    expect(store.differences()).toEqual([4]);

    store.adoptBaselineChar(4);

    expect(store.activeVersion().text.startsWith('春眠不觉晓')).toBeTrue();
    expect(store.differences()).toEqual([]);
    const records = store.adoptions();
    expect(records.length).toBe(1);
    expect(records[0].from).toBe('小');
    expect(records[0].to).toBe('晓');
    expect(records[0].baselineId).toBe('version-song');
    expect(records[0].baselineName).toBe('宋刻本异文');
  });

  it('用字相同的位置不产生采纳记录', () => {
    store.adoptBaselineChar(0);
    expect(store.adoptions().length).toBe(0);
  });

  it('撤销采纳后恢复原来的字并移除记录', () => {
    makeDifference();
    store.adoptBaselineChar(4);
    const record = store.adoptions()[0];

    store.revertAdoption(record.id);

    expect(store.activeVersion().text.startsWith('春眠不觉小')).toBeTrue();
    expect(store.adoptions().length).toBe(0);
    expect(store.differences()).toEqual([4]);
  });

  it('全局撤销也能回退采纳', () => {
    makeDifference();
    store.adoptBaselineChar(4);

    store.undo();

    expect(store.activeVersion().text.startsWith('春眠不觉小')).toBeTrue();
    expect(store.adoptions().length).toBe(0);
  });

  it('正文再被改动后，对不上位置的采纳记录被清理', () => {
    makeDifference();
    store.adoptBaselineChar(4);
    expect(store.adoptions().length).toBe(1);

    // 同一位置又被手工改成别的字，原记录不应再挂着
    store.updateText('春眠不觉大，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。');
    expect(store.adoptions().length).toBe(0);
  });

  it('正文长度变化导致位置错位时记录同样被清理', () => {
    makeDifference();
    store.adoptBaselineChar(4);
    expect(store.adoptions().length).toBe(1);

    store.updateText('春眠酣不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。');
    expect(store.adoptions().length).toBe(0);
  });

  it('导出的校对稿包含采纳记录及其底本来源', () => {
    makeDifference();
    store.adoptBaselineChar(4);

    const copy = store.exportProofreadCopy();
    expect(copy).toContain('## 底本采纳记录');
    expect(copy).toContain('宋刻本异文');
    expect(copy).toContain('“小”改从“晓”');
  });

  it('未采纳时导出稿明确说明', () => {
    expect(store.exportProofreadCopy()).toContain('本次校勘未采纳底本用字。');
  });
});
