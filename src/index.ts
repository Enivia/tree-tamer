import produce, { Draft } from 'immer';

const DEFAULT_SUB_KEY = 'children';

type NodeCallback<DataType extends Record<string, any>> = (n: DataType) => boolean;

export default class TreeTamer<DataType extends Record<string, any>> {
  private _data: DataType[];
  get data() {
    return this._data;
  }

  private subKey: keyof DataType = DEFAULT_SUB_KEY;

  constructor(data: DataType[], subKey?: keyof DataType) {
    this._data = data;
    this.subKey = subKey || DEFAULT_SUB_KEY;
  }

  private $update(callback: (draft: Draft<DataType[]>) => void) {
    produce(this.data, callback);
  }

  private $forEach(data: DataType[], callback: (n: DataType) => void) {
    if (!data) return;
    let open = [...data];
    let node: DataType;
    while ((node = <DataType>open.pop())) {
      callback(node);
      if (node[this.subKey]) {
        open = node[this.subKey].concat(open);
      }
    }
  }

  private $filter(data: DataType[], callback: NodeCallback<DataType>) {
    return (data || []).reduce<DataType[]>((res, node) => {
      const sub = this.$filter(node[this.subKey], callback);
      if (callback(node) || sub.length) {
        res.push({ ...node, [this.subKey]: sub });
      }
      return res;
    }, []);
  }

  public forEach(callback: (n: DataType) => void) {
    this.$forEach(this.data, callback);
  }

  public insert(child: DataType, callback: NodeCallback<DataType>) {
    this.$update(draft => {
      this.$forEach(<DataType[]>draft, n => {
        if (callback(n)) {
          n[this.subKey] = <DataType[keyof DataType]>(n[this.subKey] || []);
          n[this.subKey].push(child);
        }
      });
    });
  }

  public remove(callback: NodeCallback<DataType>) {
    this.$update(draft => {
      this.$forEach(<DataType[]>draft, n => {
        n[this.subKey] = n[this.subKey]?.filter((n: DataType) => !callback(n));
      });
    });
  }

  public update(data: DataType, callback: NodeCallback<DataType>) {
    this.$update(draft => {
      this.$forEach(<DataType[]>draft, n => {
        if (callback(n)) {
          n = { ...n, ...data };
        }
      });
    });
  }

  public filter(callback: NodeCallback<DataType>) {
    return this.$filter(this.data, callback);
  }
}
