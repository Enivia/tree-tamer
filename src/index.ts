import produce, { Draft } from 'immer';

const DEFAULT_SUB_KEY = 'children';

type DataType = Record<string, any>;
type NodeCallback<T, R = boolean> = (n: T) => R;

export default class TreeTamer<
  T extends DataType = { [k: string]: any; children?: DataType[] }
> {
  private _data: T[];
  public get data() {
    return this._data;
  }

  private subKey: keyof T;

  constructor(data: T[], subKey: keyof T = DEFAULT_SUB_KEY) {
    this._data = data;
    this.subKey = subKey;
  }

  private $update(callback: (draft: Draft<T[]>) => void) {
    this._data = produce(this.data, callback);
  }

  private $forEach(data: T[], callback: NodeCallback<T, void>) {
    if (!data) return;
    let open = [...data];
    let node: T;
    while ((node = <T>open.pop())) {
      callback(node);
      if (node[this.subKey]) {
        open = open.concat(node[this.subKey]);
      }
    }
  }

  private $filter(data: T[], callback: NodeCallback<T>) {
    return (data || []).reduce<T[]>((res, node) => {
      const sub = this.$filter(node[this.subKey], callback);
      if (callback(node) || sub.length) {
        res.push({ ...node, [this.subKey]: sub });
      }
      return res;
    }, []);
  }

  /**
   * insert node
   * @param child child data
   * @param callback callback to find parent node (default insert to root)
   * @returns 
   */
  public insert(child: T, callback?: NodeCallback<T>) {
    if (!callback) {
      this._data = this.data.concat(child);
      return;
    }
    this.$update(draft => {
      this.$forEach(draft as T[], n => {
        if (callback(n)) {
          n[this.subKey] = n[this.subKey] ? n[this.subKey].concat(child) : [child];
        }
      });
    });
  }

  public remove(callback: NodeCallback<T>) {
    this.$update(draft => {
      this.$forEach(draft as T[], n => {
        n[this.subKey] = n[this.subKey]?.filter((n: T) => !callback(n));
      });
    });
  }

  public update(data: Partial<T>, callback: NodeCallback<T>) {
    this.$update(draft => {
      this.$forEach(draft as T[], n => {
        if (callback(n)) {
          for (const k in data) {
            n[k] = data[k] as any;
          }
        }
      });
    });
  }

  public forEach(callback: NodeCallback<T, void>) {
    this.$forEach(this.data, callback);
  }

  public find(callback: NodeCallback<T>) {
    if (!this.data) return;
    let open = [...this.data];
    let node: T;
    while ((node = <T>open.pop())) {
      if (callback(node)) {
        return node;
      }
      if (node[this.subKey]) {
        open = node[this.subKey].concat(open);
      }
    }
    return;
  }

  public findAll(callback: NodeCallback<T>) {
    const result: T[] = [];
    this.$forEach(this.data, n => {
      if (callback(n)) {
        result.push(n);
      }
    });
    return result;
  }

  public filter(callback: NodeCallback<T>) {
    return this.$filter(this.data, callback);
  }
}
