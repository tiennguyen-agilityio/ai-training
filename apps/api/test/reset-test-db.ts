// Must stay first: loads .env.test before the MikroORM config reads process.env
import './setup-env.js';
import { MikroORM } from '@mikro-orm/postgresql';
import mikroOrmConfig from '../src/configs/mikro-orm.config.js';

// tsx (esbuild) does not emit decorator metadata, so entities cannot be discovered here.
// Truncate every table except the migrations bookkeeping table instead, which is what
// SchemaGenerator.clearDatabase() does.
async function main(): Promise<void> {
  const orm = await MikroORM.init({
    ...mikroOrmConfig,
    entities: [],
    entitiesTs: [],
    debug: false,
  });
  const tables: { table_name: string }[] = await orm.em.getConnection().execute(
    `select table_name from information_schema.tables
       where table_schema = current_schema() and table_type = 'BASE TABLE'
       and table_name <> 'mikro_orm_migrations'`,
  );
  if (tables.length > 0) {
    const names = tables.map(({ table_name }) => `"${table_name}"`).join(', ');
    await orm.em
      .getConnection()
      .execute(`truncate table ${names} restart identity cascade`);
  }
  await orm.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
