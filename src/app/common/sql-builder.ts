import { Column, Entity, FilterBase, FilterConsumerBridgeToSqlRequest, SortSegment, SqlCommand, SqlResult } from '@remult/core';

export class SqlBuilder {
    max(val: any): any {
      return this.func('max', val);
    }
  
    extractNumber(from: any): any {
      return this.build("NULLIF(regexp_replace(", from, ", '\\D','','g'), '')::numeric");
    }
  
    str(val: string): string {
      if (val == undefined)
        val = '';
      return '\'' + val.replace(/'/g, '\'\'') + '\'';
    }
    private dict = new Map<Column, string>();
  
  
    private entites = new Map<Entity, string>();
  
    sumWithAlias(what: any, alias: string, ...when: any[]) {
      if (when && when.length > 0) {
        return this.columnWithAlias(this.func('sum', this.case([{ when: when, then: what }], 0)), alias);
      }
      else {
        return this.columnWithAlias(this.func('sum', what), alias);
      }
    }
  
    addEntity(e: Entity, alias?: string) {
      if (alias) {
        for (const c of e.columns) {
          this.dict.set(c, alias);
        }
  
        this.entites.set(e, alias);
      }
    }
    columnWithAlias(a: any, b: any) {
      return this.build(a, ' ', b);
    }
    build(...args: any[]): string {
      let result = '';
      args.forEach(e => {
  
        result += this.getItemSql(e);
      });
      return result;
    }
    func(funcName: string, ...args: any[]): any {
      return this.build(funcName, '(', args, ')');
    }
  
    getItemSql(e: any) {
      if (this.dict.has(e))
        return this.dict.get(e) + '.' + e.defs.dbName;
      let v = e;
      if (e instanceof Entity)
        v = e.defs.dbName;
      if (e instanceof Column)
        v = e.defs.dbName;
  
      let f = e as FilterBase;
      if (f && f.__applyToConsumer) {
  
        let bridge = new FilterConsumerBridgeToSqlRequest(new myDummySQLCommand());
        f.__applyToConsumer(bridge);
        return bridge.where.substring(' where '.length);
      }
      if (e instanceof Array) {
        v = e.map(x => this.getItemSql(x)).join(', ');
      }
      return v;
    }
    eq<T>(a: Column<T>, b: T | Column<T>) {
      return this.build(a, ' = ', b);
    }
    eqAny(a: string, b: any) {
      return this.build(a, ' = ', b);
    }
    ne<T>(a: Column<T>, b: T | Column<T>) {
      return this.build(a, ' <> ', b);
    }
    notNull(col: Column) {
      return this.build(col, ' is not null');
    }
  
  
    gt<T>(a: Column<T>, b: T | Column<T>) {
      return this.build(a, ' > ', b);
    }
    gtAny(a: Column, b: any | any) {
      return this.build(a, ' > ', b);
    }
    and(...args: any[]): string {
      return args.map(x => this.getItemSql(x)).filter(x => x != undefined && x != '').join(' and ');
    }
    or(...args: any[]): string {
      return "(" + args.map(x => this.getItemSql(x)).join(' or ') + ")";
    }
    private last = 1;
    getEntityAlias(e: Entity) {
      let result = this.entites.get(e);
      if (result)
        return result;
      result = 'e' + this.last++;
      this.addEntity(e, result);
      return result;
  
  
  
    }
    columnSumInnerSelect(rootEntity: Entity, col: Column<Number>, query: FromAndWhere) {
      return this.columnDbName(rootEntity, {
        select: () => [this.build("sum(", col, ")")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      });
    }
    columnCount(rootEntity: Entity, query: FromAndWhere) {
      return this.columnDbName(rootEntity, {
        select: () => [this.build("count(*)")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      });
    }
    columnCountWithAs(rootEntity: Entity, query: FromAndWhere, colName:string) {
      return this.columnDbName(rootEntity, {
        select: () => [this.build("count(*) ",colName)],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      });
    }
    columnMaxWithAs(rootEntity: Entity,column:Column, query: FromAndWhere, colName:string) {
      return this.columnDbName(rootEntity, {
        select: () => [this.build("max(",column,") ",colName)],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      });
    }
    columnInnerSelect(rootEntity: Entity, query: QueryBuilder) {
      this.addEntity(rootEntity, rootEntity.defs.dbName);
      return '(' + this.query(query) + ' limit 1)';
    }
    countInnerSelect(query: FromAndWhere, mappedColumn: any) {
      return this.build("(", this.query({
        select: () => [this.build("count(*)")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      }), ") ", mappedColumn);
    }
    countDistinctInnerSelect(col: Column, query: FromAndWhere, mappedColumn: any) {
      return this.build("(", this.query({
        select: () => [this.build("count(distinct ", col, ")")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      }), ") ", mappedColumn);
    }
  
  
    countDistinct(col: Column, mappedColumn: Column<number>) {
      return this.build("count (distinct ", col, ") ", mappedColumn)
    }
    count() {
      return this.func('count', '*');
    }
    minInnerSelect(col: Column, query: FromAndWhere, mappedColumn: Column) {
      return this.build('(', this.query({
        select: () => [this.build("min(", col, ")")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      }), ") ", mappedColumn);
    }
    maxInnerSelect(col: Column, query: FromAndWhere, mappedColumn: Column) {
      return this.build('(', this.query({
        select: () => [this.build("max(", col, ")")],
        from: query.from,
        innerJoin: query.innerJoin,
        outerJoin: query.outerJoin,
        crossJoin: query.crossJoin,
        where: query.where
      }), ") ", mappedColumn);
    }
    columnDbName(rootEntity: Entity, query: QueryBuilder) {
      this.addEntity(rootEntity, rootEntity.defs.dbName);
      return '(' + this.query(query) + ')';
    }
    entityDbName(query: QueryBuilder) {
      return '(' + this.query(query) + ') result';
    }
    entityDbNameUnionAll(query1: QueryBuilder, query2: QueryBuilder) {
      return this.unionAll(query1, query2) + ' result';
    }
    union(query1: QueryBuilder, query2: QueryBuilder) {
      return '(' + this.query(query1) + ' union ' + this.query(query2) + ')';
    }
    unionAll(query1: QueryBuilder, query2: QueryBuilder) {
      return '(' + this.query(query1) + ' union  all ' + this.query(query2) + ')';
    }
  
    in(col: Column, ...values: any[]) {
      return this.build(col, ' in (', values, ')');
    }
    not(arg0: string): any {
      return this.build(' not (', arg0, ')');
    }
    delete(e: Entity, ...where: string[]) {
      return this.build('delete from ', e, ' where ', this.and(...where));
    }
    update(e: Entity, info: UpdateInfo) {
      let result = [];
      result.push('update ', e, ' ', this.getEntityAlias(e), ' set ');
  
      let from: string;
      if (info.from) {
        from = this.build(' from ', info.from, ' ', this.getEntityAlias(info.from));
      }
      let set = info.set();
      result.push(set.map(a => this.build(this.build(a[0].defs.dbName, ' = ', a[1]))));
      if (from)
        result.push(from);
  
      if (info.where) {
        result.push(' where ')
        result.push(this.and(...info.where()));
      }
      return this.build(...result);
    }
    insert(info: InsertInfo) {
      let result = [];
      result.push('insert into ', info.into, ' ');
  
      result.push('(', info.set().map(a => a[0].defs.dbName), ') ');
      result.push(this.query({
        select: () => info.set().map(a => a[1]),
        from: info.from,
        where: info.where
      }));
  
      return this.build(...result);
    }
    query(query: QueryBuilder) {
  
      let from = [];
      from.push(' from ');
      from.push(query.from, ' ', this.getEntityAlias(query.from));
      if (query.crossJoin) {
        query.crossJoin().forEach(j => {
          from.push(' cross join ', j, ' ', this.getEntityAlias(j));
        });
      }
      if (query.innerJoin) {
        query.innerJoin().forEach(j => {
          let alias = this.getEntityAlias(j.to);
          from.push(' left join ', j.to, ' ', alias, ' on ', this.and(...j.on()));
        });
      }
      if (query.outerJoin) {
        query.outerJoin().forEach(j => {
          let alias = this.getEntityAlias(j.to);
          from.push(' left outer join ', j.to, ' ', alias, ' on ', this.and(...j.on()));
        });
      }
      let result = [];
      result.push('select ');
      result.push(query.select());
      result.push(...from);
      let where = [];
      if (query.where) {
        where.push(...query.where());
      }
      {
        let before: FilterBase = {
          __applyToConsumer: (x) => {
          }
        };
        let x = query.from.__decorateWhere(before);
        if (x != before)
          where.push(x);
      }
      if (where.length > 0)
        result.push(' where ', this.and(...where));
      if (query.groupBy) {
        result.push(' group by ');
        result.push(query.groupBy());
      }
      if (query.having) {
        result.push(' having ', this.and(...query.having()));
      }
      if (query.orderBy) {
        result.push(' order by ', query.orderBy.map(x => {
          var f = x as SortSegment;
          if (f && f.column) {
            return this.build(f.column, ' ', f.descending ? 'desc' : '')
          }
          else return x;
  
        }));
      }
      return this.build(...result);
  
  
  
    }
    case(args: CaseWhenItemHelper[], else_: any) {
      if (args.length == 0)
        return else_;
      let result = [];
      result.push('case');
      args.forEach(x => {
        result.push(' when ');
        result.push(this.and(...x.when));
        result.push(' then ');
        result.push(x.then);
      });
      result.push(' else ');
      result.push(else_);
      result.push(' end');
      return this.build(...result);
  
    }
  
    innerSelect(builder: QueryBuilder, col: Column) {
      return this.build('(', this.query(builder), ' limit 1) ', col);
    }
  }
  class myDummySQLCommand implements SqlCommand {

    execute(sql: string): Promise<SqlResult> {
      throw new Error("Method not implemented.");
    }
    addParameterAndReturnSqlToken(val: any): string {
      if (typeof (val) == "string") {
        return new SqlBuilder().str(val);
      }
      return val.toString();
    }
  
  
  }
  export interface QueryBuilder {
    select: () => any[];
    from: Entity;
    crossJoin?: () => Entity[];
    innerJoin?: () => JoinInfo[];
    outerJoin?: () => JoinInfo[];
    where?: () => any[];
    orderBy?: (Column | SortSegment)[];
    groupBy?: () => any[];
    having?: () => any[];
  }
  export interface FromAndWhere {
    from: Entity;
    crossJoin?: () => Entity[];
    innerJoin?: () => JoinInfo[];
    outerJoin?: () => JoinInfo[];
    where?: () => any[];
  }
  export interface UpdateInfo {
    set: () => [Column, any][],
    where?: () => any[];
    from?: Entity;
  }
  export interface InsertInfo {
    into: Entity;
    set: () => [Column, any][];
    from: Entity;
    where?: () => any[];
  }
  export interface JoinInfo {
    to: Entity;
    on: () => any[];
  }
  
  export interface CaseWhenItemHelper {
    when: any[];
    then: any;
  }