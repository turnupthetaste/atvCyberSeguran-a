import { Pool } from "pg";

const pool = new Pool({
  host: "postgres",
  user: "admin",
  password: "senha123",
  database: "aula_db",
  port: 5432,
});

export default pool;
