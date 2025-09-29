import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../src/modules/database/database.module';
import configuration from '../../src/config/configuration';

describe('Database Connection', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        DatabaseModule,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should load database configuration', () => {
    const dbConfig = configService.get('database');
    expect(dbConfig).toBeDefined();
    expect(dbConfig.uri).toBeDefined();
    expect(dbConfig.options).toBeDefined();
  });

  it('should have correct MongoDB URI format', () => {
    const dbUri = configService.get<string>('database.uri');
    expect(dbUri).toMatch(/^mongodb(\+srv)?:\/\//);
  });

  it('should have retry writes enabled', () => {
    const dbOptions = configService.get('database.options');
    expect(dbOptions.retryWrites).toBe(true);
  });

  it('should set write concern to majority', () => {
    const dbOptions = configService.get('database.options');
    expect(dbOptions.w).toBe('majority');
  });
});
