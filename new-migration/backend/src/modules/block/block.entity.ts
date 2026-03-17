export class Block {
  id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  cemeteryId?: string;

  constructor(data?: Partial<Block>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Block>): Block {
    return new Block(data);
  }
}