declare module "mo-betta-sqlite3" {
  export class Database {
    /**
     * Create a new database connection.
     * The database will automatically be set to UTF-16 encoding.
     * @param filename Path to SQLite database file
     */
    constructor(filename: string);

    /**
     * Prepare a SQL statement for execution
     * @param sql SQL query string
     * @returns A prepared statement
     */
    prepare(sql: string): Statement;

    /**
     * Execute a SQL statement without returning results
     * @param sql SQL statement to execute
     */
    exec(sql: string): void;

    /**
     * Close the database connection
     */
    close(): void;
  }

  export class Statement implements Iterable<Row> {
    /**
     * Step to the next row in the result set
     * @returns true if a row is available, false if no more rows
     */
    step(): boolean;

    /**
     * Get the value of a column in the current row
     * @param column Column index (0-based) or column name
     * @returns The column value (string values use zero-copy external strings)
     */
    get(column: number | string): ColumnValue;

    /**
     * Finalize the statement and free resources
     */
    finalize(): void;

    /**
     * Reset the statement to be executed again
     */
    reset(): void;

    /**
     * Get an iterator for this statement
     * @returns This statement as an iterator
     */
    iterate(): Iterator<Row>;

    /**
     * Iterator protocol implementation
     */
    [Symbol.iterator](): Iterator<Row>;

    /**
     * Iterator next method
     */
    next(): IteratorResult<Row>;
  }

  /**
   * Possible column value types
   */
  export type ColumnValue = string | number | bigint | Buffer | null;

  /**
   * A row object with column names as keys and their values
   */
  export type Row = { [columnName: string]: ColumnValue };
}
