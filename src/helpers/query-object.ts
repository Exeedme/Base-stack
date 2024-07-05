type OrderType = { [key: string]: 'ASC' | 'DESC' };
type DoubleOrderType = { [key: string]: OrderType };
export class PaginationQueryObject {
  take?: number;
  skip?: number;
  order: {
    [key: string]: 'ASC' | 'DESC' | OrderType | DoubleOrderType;
  };

  constructor({
    page,
    limit,
    orderBy,
    orderDirection,
  }: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }) {
    this.skip = 0;
    this.take = limit ? limit : 32;

    if (page) {
      this.skip = page * this.take;
    }

    this.order = { createdAt: 'DESC' };
    if (orderBy) {
      const direction = orderDirection ? orderDirection : 'DESC';
      this.order = {
        [orderBy]: direction,
        ...this.order,
      };
    }
  }

  getQueryObject() {
    return {
      skip: this.skip,
      take: this.take,
      order: this.order,
    };
  }
}
