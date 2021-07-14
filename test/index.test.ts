import TreeTamer from '../src';

type DefaultData = { id: string; name: string; children?: DefaultData[] };
const defaultData = [{ id: '1', name: '1', children: [{ id: '1-1', name: '1-1' }] }];
describe('Default SubKey', () => {
  const tamer = new TreeTamer<DefaultData>(defaultData);
  describe('Insert', () => {
    it('Insert to the root', () => {
      tamer.insert({ id: '2', name: '2' });
      expect(tamer.data.length).toEqual(2);
    });
    it('Insert to parent node', () => {
      tamer.insert({ id: '1-2', name: '1-2' }, n => n.id === '1');
      expect(tamer.find(n => n.id === '1')?.children?.length).toEqual(2);
    });
    it('Insert to leaf', () => {
      tamer.insert({ id: '1-1-1', name: '1-1-1' }, n => n.id === '1-1');
      expect(tamer.find(n => n.id === '1-1')?.children?.length).toEqual(1);
    });
  });

  it('Remove', () => {
    tamer.remove(n => n.id === '1-1-1');
    expect(tamer.find(n => n.id === '1-1')?.children?.length).toEqual(0);
  });
  it('Update', () => {
    tamer.update({ name: 'update-name' }, n => n.id === '1-1');
    expect(tamer.find(n => n.id === '1-1')?.name).toEqual('update-name');
  });
  it('FindAll', () => {
    const res = tamer.findAll(n => n.name.indexOf('1') > -1);
    expect(res.length).toEqual(2);
  });
});

type CustomData = { id: string; name: string; sub?: CustomData[] };
const customSubKey: CustomData[] = [{ id: '1', name: '1', sub: [{ id: '1-1', name: '1-1' }] }];
describe('Custom SubKey', () => {
  const tamer = new TreeTamer<CustomData>(customSubKey, 'sub');
  it('Insert', () => {
    tamer.insert({ id: '1-1-1', name: '1-1-1' }, n => n.id === '1-1');
    expect(tamer.find(n => n.id === '1-1')?.sub?.length).toEqual(1);
  });
  it('Remove', () => {
    tamer.remove(n => n.id === '1-1-1');
    expect(tamer.find(n => n.id === '1-1')?.sub?.length).toEqual(0);
  });
  it('Update', () => {
    tamer.update({ name: 'update-name' }, n => n.id === '1-1');
    expect(tamer.find(n => n.id === '1-1')?.name).toEqual('update-name');
  });
});
