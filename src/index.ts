import produce, { Draft } from 'immer';

const DEFAULT_SUB_KEY = 'children';

type DataType = Record<string, any>;
type NodeCallback<T, R = boolean> = (n: T) => R;
type Recursive<T, K extends keyof T> = Omit<T, K> & { [k in K]?: Recursive<T, K>[] };

export default class TreeTamer<
  T extends DataType = { [k: string]: any; children?: DataType[] },
  K extends keyof T = 'children'
> {
  private _data: Recursive<T, K>[];
  get data() {
    return this._data;
  }

  private subKey: K = DEFAULT_SUB_KEY as K;

  constructor(data: Recursive<T, K>[], subKey?: K) {
    this._data = data;
    this.subKey = subKey || (DEFAULT_SUB_KEY as K);
  }

  private $update(callback: (draft: Draft<Recursive<T, K>[]>) => void) {
    produce(this.data, callback);
  }

  private $forEach(data: Recursive<T, K>[], callback: NodeCallback<Recursive<T, K>, void>) {
    if (!data) return;
    let open = [...data];
    let node: Recursive<T, K>;
    while ((node = <Recursive<T, K>>open.pop())) {
      callback(node);
      if (node[this.subKey]) {
        open = node[this.subKey].concat(open);
      }
    }
  }

  private $filter(data: Recursive<T, K>[], callback: NodeCallback<Recursive<T, K>>) {
    return (data || []).reduce<Recursive<T, K>[]>((res, node) => {
      const sub = this.$filter(node[this.subKey], callback);
      if (callback(node) || sub.length) {
        res.push({ ...node, [this.subKey]: sub });
      }
      return res;
    }, []);
  }

  public insert(child: Recursive<T, K>, callback: NodeCallback<Recursive<T, K>>) {
    this.$update(draft => {
      this.$forEach(draft as Recursive<T, K>[], n => {
        if (callback(n)) {
          n[this.subKey] = n[this.subKey] ? n[this.subKey].concat(child) : [];
        }
      });
    });
  }

  public remove(callback: NodeCallback<Recursive<T, K>>) {
    this.$update(draft => {
      this.$forEach(draft as Recursive<T, K>[], n => {
        n[this.subKey] = n[this.subKey]?.filter((n: T) => !callback(n));
      });
    });
  }

  public update(data: Recursive<T, K>, callback: NodeCallback<Recursive<T, K>>) {
    this.$update(draft => {
      this.$forEach(draft as Recursive<T, K>[], n => {
        if (callback(n)) {
          n = { ...n, ...data };
        }
      });
    });
  }

  public forEach(callback: NodeCallback<Recursive<T, K>, void>) {
    this.$forEach(this.data, callback);
  }

  public find(callback: NodeCallback<Recursive<T, K>>) {
    if (!this.data) return;
    let open = [...this.data];
    let node: Recursive<T, K>;
    while ((node = <Recursive<T, K>>open.pop())) {
      if (callback(node)) {
        return node;
      }
      if (node[this.subKey]) {
        open = node[this.subKey].concat(open);
      }
    }
  }

  public findAll(callback: NodeCallback<Recursive<T, K>>) {
    const result: Recursive<T, K>[] = [];
    this.$forEach(this.data, n => {
      if (callback(n)) {
        result.push(n);
      }
    });
    return result;
  }

  public filter(callback: NodeCallback<Recursive<T, K>>) {
    return this.$filter(this.data, callback);
  }
}
