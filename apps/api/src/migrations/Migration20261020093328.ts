import { Migration } from '@mikro-orm/migrations';

// Baseline: the whole schema in one migration. It replaces the earlier chain
// (Migration20260824081651, Migration20260825181322, Migration20260825200222)
// plus the product changes from 15dc044 that never got a migration. A database
// built by the old chain already has this schema, so it records this migration
// as executed instead of running it; see README "Database & Migrations".
export class Migration20261020093328 extends Migration {
  override name = 'Migration20261020093328';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "categories" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "slug" varchar(255) not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "categories" add constraint "categories_name_unique" unique ("name");`,
    );

    this.addSql(
      `create table "products" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "category_id" uuid not null, "name" varchar(255) not null, "slug" varchar(255) not null, "description" text not null, "roast_level" text not null, "is_organic" boolean not null default false, "is_fair_trade" boolean not null default false, "status" text not null default 'DRAFT', "tasting_notes" text null, "origin" text not null, "processing_method" text not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "products" add constraint "products_name_unique" unique ("name");`,
    );

    this.addSql(
      `create table "product_images" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "product_id" uuid not null, "url" text not null, "is_primary" boolean not null default false, "sort_order" int not null default 0, primary key ("id"));`,
    );

    this.addSql(
      `create table "product_variants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "product_id" uuid not null, "sku" varchar(255) not null, "weight" numeric(10,2) not null, "unit" text not null, "name" varchar(255) not null, "price" numeric(10,2) not null, "discount_type" text null, "discount_value" numeric(10,2) null, "quantity" int not null default 0, primary key ("id"));`,
    );
    this.addSql(
      `alter table "product_variants" add constraint "product_variants_sku_unique" unique ("sku");`,
    );

    this.addSql(
      `create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "clerk_id" varchar(255) not null, "email" varchar(255) not null, "role" text not null default 'USER', "first_name" varchar(255) not null, "last_name" varchar(255) not null, "phone_number" varchar(255) null, "avatar_url" varchar(255) null, "status" text not null default 'ACTIVE', primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_clerk_id_unique" unique ("clerk_id");`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `alter table "products" add constraint "products_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "products" add constraint "products_roast_level_check" check ("roast_level" in ('LIGHT', 'MEDIUM', 'DARK'));`,
    );
    this.addSql(
      `alter table "products" add constraint "products_status_check" check ("status" in ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'));`,
    );

    this.addSql(
      `alter table "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "product_variants" add constraint "product_variants_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "product_variants" add constraint "product_variants_unit_check" check ("unit" in ('KG', 'G', 'ML', 'L'));`,
    );
    this.addSql(
      `alter table "product_variants" add constraint "product_variants_discount_type_check" check ("discount_type" in ('PERCENT', 'FIXED'));`,
    );

    this.addSql(
      `alter table "users" add constraint "users_role_check" check ("role" in ('ADMIN', 'USER'));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_status_check" check ("status" in ('ACTIVE', 'INACTIVE'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "products" drop constraint "products_category_id_foreign";`,
    );
    this.addSql(
      `alter table "product_images" drop constraint "product_images_product_id_foreign";`,
    );
    this.addSql(
      `alter table "product_variants" drop constraint "product_variants_product_id_foreign";`,
    );

    this.addSql(`drop table if exists "categories" cascade;`);
    this.addSql(`drop table if exists "products" cascade;`);
    this.addSql(`drop table if exists "product_images" cascade;`);
    this.addSql(`drop table if exists "product_variants" cascade;`);
    this.addSql(`drop table if exists "users" cascade;`);
  }
}
