export class Topic {
  name: string;
  partitions?: string[];
  constructor(name: string, partitions: string[]) {
    this.name = name;
    this.partitions = partitions;
  }
}
