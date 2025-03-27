import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1743003048762 implements MigrationInterface {
  name = 'InitialSchema1743003048762';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."registrations_status_enum" AS ENUM('PRESENTE', 'AUSENTE', 'TRABAJANDO', 'NO_LABORABLE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state" boolean NOT NULL DEFAULT true, "entry_capture" text, "exit_capture" text, "entry_date" TIMESTAMP, "exit_date" TIMESTAMP, "articulo" character varying, "description" character varying, "comment" character varying, "justification" character varying, "status" "public"."registrations_status_enum" NOT NULL DEFAULT 'PRESENTE', "type" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT '"2025-03-26T15:30:51.033Z"', "user_id" uuid, CONSTRAINT "PK_6013e724d7b22929da9cd7282d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ministries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "private_address" text, "function" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ad897fa0432df1de62b552a8706" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "secretariats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "private_address" text, "function" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ministryId" uuid, CONSTRAINT "PK_e340ddd4331688a2bbf6c18b017" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shift" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "entry_hour" TIME, "exit_hour" TIME, CONSTRAINT "UQ_d336a07a501e3a71abb7b695132" UNIQUE ("name"), CONSTRAINT "PK_53071a6485a1e9dc75ec3db54b9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_absences_type_enum" AS ENUM('ARTICULO', 'OTRO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_absences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_date" date NOT NULL, "end_date" date NOT NULL, "articulo" character varying, "description" character varying(255), "is_optional" boolean NOT NULL DEFAULT false, "type" "public"."employee_absences_type_enum" NOT NULL DEFAULT 'ARTICULO', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_ef8fc475dab9339d8a9a057b2c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" text, "entry_hour" TIME, "exit_hour" TIME, "name" character varying(50) NOT NULL, "last_name" character varying(50) DEFAULT 'Google', "document" integer NOT NULL, "image" character varying DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png', "sex" character varying(50), "asset" character varying(50), "situation" character varying(50), "income_date" date, "birth_date" date, "phone" bigint, "cellphone" bigint, "private_address" text, "study_level" character varying(50), "profession" text, "function" text, "legal_instrument" text, "labor_address" text, "email" character varying(50) NOT NULL, "state" boolean NOT NULL DEFAULT true, "rol" character varying DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_login" TIMESTAMP, "secretariat_id" uuid, "shiftId" uuid, CONSTRAINT "UQ_c1b20b2a1883ed106c3e746c25a" UNIQUE ("document"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."non_working_days_type_enum" AS ENUM('FERIADO_FIJO', 'FERIADO_MOVIL', 'VACACIONES_GENERAL', 'CIERRE_ANUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "non_working_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_date" date NOT NULL, "end_date" date NOT NULL, "description" character varying(255), "is_optional" boolean NOT NULL DEFAULT false, "year" integer, "type" "public"."non_working_days_type_enum" NOT NULL DEFAULT 'FERIADO_FIJO', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b1f255745db7a618705de83faf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."articulos_statustype_enum" AS ENUM('PRESENTE', 'AUSENTE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "articulos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "statusType" "public"."articulos_statustype_enum" NOT NULL, "description" text, CONSTRAINT "PK_c0b7bae1b9e1d86fa63a0c924b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sub_incisos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "incisoId" uuid, CONSTRAINT "PK_5af8805c1cc759e032dee2510bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "incisos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "articuloId" uuid, CONSTRAINT "PK_bc46d71d114e54f737fbadba296" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD CONSTRAINT "FK_6aacc9b213fd8c881af6c738ecf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "secretariats" ADD CONSTRAINT "FK_73178151163c93123dd93403690" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD CONSTRAINT "FK_1b988e61c9aec11bef68289270b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_6a5e685b680ea3240d617931b3d" FOREIGN KEY ("secretariat_id") REFERENCES "secretariats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_ad27b0c2869c703b5358714da74" FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_incisos" ADD CONSTRAINT "FK_1c2261d6af5a77842a3281f9909" FOREIGN KEY ("incisoId") REFERENCES "incisos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incisos" ADD CONSTRAINT "FK_f4f2be6579cf7c25a57de0e36f6" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incisos" DROP CONSTRAINT "FK_f4f2be6579cf7c25a57de0e36f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_incisos" DROP CONSTRAINT "FK_1c2261d6af5a77842a3281f9909"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_ad27b0c2869c703b5358714da74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_6a5e685b680ea3240d617931b3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT "FK_1b988e61c9aec11bef68289270b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "secretariats" DROP CONSTRAINT "FK_73178151163c93123dd93403690"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "FK_6aacc9b213fd8c881af6c738ecf"`,
    );
    await queryRunner.query(`DROP TABLE "incisos"`);
    await queryRunner.query(`DROP TABLE "sub_incisos"`);
    await queryRunner.query(`DROP TABLE "articulos"`);
    await queryRunner.query(`DROP TYPE "public"."articulos_statustype_enum"`);
    await queryRunner.query(`DROP TABLE "non_working_days"`);
    await queryRunner.query(`DROP TYPE "public"."non_working_days_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "employee_absences"`);
    await queryRunner.query(`DROP TYPE "public"."employee_absences_type_enum"`);
    await queryRunner.query(`DROP TABLE "shift"`);
    await queryRunner.query(`DROP TABLE "secretariats"`);
    await queryRunner.query(`DROP TABLE "ministries"`);
    await queryRunner.query(`DROP TABLE "registrations"`);
    await queryRunner.query(`DROP TYPE "public"."registrations_status_enum"`);
  }
}
