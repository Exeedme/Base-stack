import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Entities } from './entities';
import { env } from '../config/env';
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { EnvName } from '../enums/environments';

export default class SnakeNamingStrategy
	extends DefaultNamingStrategy
	implements NamingStrategyInterface {
	override columnName(
		propertyName: string,
		customName: string,
		embeddedPrefixes: string[],
	): string {
		return snakeCase(embeddedPrefixes.join('_')) + (customName || snakeCase(propertyName)); // TODO: is snakeCase(propertyName) needed?
	}

	override joinColumnName(relationName: string, referencedColumnName: string): string {
		return snakeCase(`${relationName}_${referencedColumnName}`);
	}

	// override eagerJoinRelationAlias(alias: string, propertyPath: string): string {
	// 	return `${alias}__${propertyPath.replace('.', '_')}`;
	// }
}

let SSL_OPTIONS: any = false;
if (env.NODE_ENV !== EnvName.DEVELOPMENT && env.NODE_ENV !== EnvName.TEST) {
	SSL_OPTIONS = { rejectUnauthorized: false };
}


const baseSettings: DataSourceOptions = {
	type: 'postgres',
	url: env.DATABASE_URL,
	ssl: SSL_OPTIONS,
	logging: false,
	entities: Entities,
	migrations: ['./dist/db/migrations/**/*.js'],
	maxQueryExecutionTime: 5 * 1000,
	poolSize: 8,
	logger: 'simple-console',
	namingStrategy: new SnakeNamingStrategy(),
};

export const AppDataSource = new DataSource(baseSettings);

export async function initializeDatabase(): Promise<void> {
	await AppDataSource.initialize();

	const sqlInMemory = await AppDataSource.driver.createSchemaBuilder().log();
	for (const query of sqlInMemory.upQueries) {
		const sqlString = `${query.query.trim()};`;
		if (env.NODE_ENV === EnvName.DEVELOPMENT) {
			console.error(sqlString);
		} else {
			// logger.error('Database change not reflected in migrations.', { migration: sqlString });
			console.log('Database change not reflected in migrations', { migration: sqlString });
		}
	}
}

export const closeDatabase = async (): Promise<void> => {
	await AppDataSource.destroy();
	console.log('Database connection closed');
};

export const cleanDatabase = async (): Promise<void> => {
	if (env.NODE_ENV !== EnvName.TEST) {
		throw new Error('cleanDatabase should only be called in test environment');
	}

	const entities = AppDataSource.entityMetadatas;
	await Promise.all(
		entities.map(async (entity) => {
			const repository = AppDataSource.getRepository(entity.name);
			await repository.query(`DELETE FROM ${entity.tableName}`);
		}),
	);
};
