// plopfile.js (V2 - schema-driven com fallback)
const fs = require('fs');
const path = require('path');

function words(str) {
  return String(str)
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split('-')
    .filter(Boolean);
}

function pascalCase(str) {
  return words(str)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function camelCase(str) {
  const p = pascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function kebabCase(str) {
  return words(str).join('-');
}

function pluralizeEnLike(name) {
  if (name.endsWith('s')) return name;
  if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
  return name + 's';
}

const PRISMA_SCALARS = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Decimal',
  'BigInt',
  'Json',
  'Bytes',
]);

function stripInlineComment(line) {
  const idx = line.indexOf('//');
  if (idx >= 0) return line.slice(0, idx).trim();
  return line.trim();
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function extractEnumNames(schemaText) {
  // captura: enum X { ... }
  const enumRegex = /enum\s+(\w+)\s*\{[\s\S]*?\}/g;
  const names = new Set();
  let m;
  while ((m = enumRegex.exec(schemaText)) !== null) {
    names.add(m[1]);
  }
  return names;
}

function extractModelBlock(schemaText, modelName) {
  // pega o bloco: model ModelName { ... }
  const re = new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const match = schemaText.match(re);
  return match ? match[1] : null;
}

function parseModelFields(modelBlock, enumNames) {
  // parse simples de linhas "fieldName Type? @attr ..."
  const lines = modelBlock
    .split('\n')
    .map((l) => stripInlineComment(l))
    .map((l) => l.trim())
    .filter(Boolean);

  const fields = [];

  for (const line of lines) {
    // ignora blocks/attributes
    if (line.startsWith('@@')) continue;
    if (line.startsWith('@')) continue;

    // exemplo: title String
    // exemplo: description String?
    // exemplo: tickets Ticket[]
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const name = parts[0];
    const rawType = parts[1]; // "String?", "Ticket[]", etc.
    const attrs = parts.slice(2).join(' '); // "@id @default(uuid()) ..."

    const isList = rawType.endsWith('[]');
    const baseType0 = isList ? rawType.slice(0, -2) : rawType;

    const isOptional = baseType0.endsWith('?');
    const baseType = isOptional ? baseType0.slice(0, -1) : baseType0;

    const hasRelationAttr = attrs.includes('@relation');
    const isScalar = PRISMA_SCALARS.has(baseType) || enumNames.has(baseType);

    const isRelation =
      hasRelationAttr || (!isScalar && (isList || /^[A-Z]/.test(baseType)));

    const isId = attrs.includes('@id');
    const isUpdatedAt = attrs.includes('@updatedAt');
    const isCreatedAt =
      attrs.includes('@default(now())') && baseType === 'DateTime';

    // status detection
    const isStatus = name === 'status' && baseType === 'Int';

    fields.push({
      name,
      baseType,
      isOptional,
      isList,
      isRelation,
      isScalar,
      isEnum: enumNames.has(baseType),
      isId,
      isCreatedAt,
      isUpdatedAt,
      isStatus,
    });
  }

  return fields;
}

function prismaScalarToTs(type, { forDto = false } = {}) {
  switch (type) {
    case 'String':
      return 'string';
    case 'Int':
    case 'Float':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return forDto ? 'string' : 'Date';
    case 'Decimal':
      // pode ser Prisma.Decimal; aqui deixo string pra entrada/entidade ser simples
      return forDto ? 'string' : 'string';
    case 'BigInt':
      return forDto ? 'string' : 'bigint';
    case 'Json':
      return 'unknown';
    case 'Bytes':
      return 'Buffer';
    default:
      // enum ou fallback
      return type; // enum name
  }
}

function validatorFor(field) {
  // retorna decorators (sem @) e se precisa importar enum
  if (field.isEnum) {
    return { decorators: ['IsEnum'], needsEnumImport: true };
  }
  switch (field.baseType) {
    case 'String':
      return { decorators: ['IsString'], needsEnumImport: false };
    case 'Int':
      return { decorators: ['IsInt'], needsEnumImport: false };
    case 'Float':
      return { decorators: ['IsNumber'], needsEnumImport: false };
    case 'Boolean':
      return { decorators: ['IsBoolean'], needsEnumImport: false };
    case 'DateTime':
      return { decorators: ['IsDateString'], needsEnumImport: false };
    case 'Decimal':
      return { decorators: ['IsString'], needsEnumImport: false };
    case 'BigInt':
      return { decorators: ['IsString'], needsEnumImport: false };
    default:
      return { decorators: ['IsString'], needsEnumImport: false };
  }
}

function buildSchemaDrivenContext({ schemaPath, prismaModel, softDelete }) {
  const schemaText = readFileSafe(schemaPath);
  if (!schemaText) return { hasSchema: false };

  const enumNames = extractEnumNames(schemaText);
  const modelBlock = extractModelBlock(schemaText, prismaModel);
  if (!modelBlock) return { hasSchema: false };

  const fields = parseModelFields(modelBlock, enumNames);

  const hasStatusField = fields.some((f) => f.isStatus);

  // entityFields = todos scalars + enums (inclui id/timestamps/status se existir)
  const entityFields = fields
    .filter((f) => (f.isScalar || f.isEnum) && !f.isList && !f.isRelation)
    .map((f) => {
      const tsType = prismaScalarToTs(f.baseType, { forDto: false });

      // nullable no prisma = ? -> costuma significar "Type?" (nullable)
      // vou modelar como "?: T | null" pra refletir bem
      const typeWithNull = f.isOptional ? `${tsType} | null` : tsType;

      return {
        name: f.name,
        tsType: typeWithNull,
        optionalProp: f.isOptional, // decide se usa ? na property
      };
    });

  // createFields: scalars/enums, exceto id/createdAt/updatedAt, exceto status se softDelete (vamos setar automaticamente),
  // exceto relations/list
  const createFields = fields
    .filter((f) => (f.isScalar || f.isEnum) && !f.isList && !f.isRelation)
    .filter((f) => !f.isId && !f.isCreatedAt && !f.isUpdatedAt)
    .filter((f) => !(softDelete && hasStatusField && f.isStatus)) // status setado internamente
    .map((f) => {
      const tsType = prismaScalarToTs(f.baseType, { forDto: true });
      const v = validatorFor(f);
      return {
        name: f.name,
        tsType,
        optionalProp: f.isOptional,
        isEnum: f.isEnum,
        enumName: f.baseType,
        decorators: v.decorators,
        needsEnumImport: v.needsEnumImport,
      };
    });

  const dateFieldsCreate = createFields
    .filter((f) => {
      const original = fields.find((x) => x.name === f.name);
      return original?.baseType === 'DateTime';
    })
    .map((f) => f.name);

  // update uses PartialType(CreateDto), mas o repository precisa converter datas também
  const dateFieldsUpdate = dateFieldsCreate.slice();

  const needsEnumImport = createFields.some((f) => f.needsEnumImport);

  return {
    hasSchema: true,
    hasStatusField,
    entityFields,
    createFields,
    needsEnumImport,
    dateFieldsCreate,
    dateFieldsUpdate,
  };
}

module.exports = function (plop) {
  plop.setHelper('pascalCase', pascalCase);
  plop.setHelper('camelCase', camelCase);
  plop.setHelper('kebabCase', kebabCase);
  plop.setHelper('pluralize', pluralizeEnLike);

  plop.setGenerator('crud-v2', {
    description:
      'CRUD V2: tenta schema.prisma (tipado). Se não achar, fallback antigo.',
    prompts: [
      {
        type: 'input',
        name: 'featureName',
        message: 'Nome do módulo/feature (ex: event, events, payment-method):',
        validate: (v) => (!!v && v.trim().length > 0) || 'Informe um nome',
      },
      {
        type: 'input',
        name: 'prismaModel',
        message: 'Nome do model Prisma (ex: Event):',
        default: (answers) => pascalCase(answers.featureName),
      },
      {
        type: 'input',
        name: 'schemaPath',
        message: 'Caminho do schema.prisma:',
        default: 'prisma/schema.prisma',
      },
      {
        type: 'confirm',
        name: 'softDelete',
        message: 'Soft delete usando status (1 ativo / 0 inativo)?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'hasPassword',
        message: 'Esse módulo tem senha (hash/compare) e campo password?',
        default: false,
      },
      {
        type: 'input',
        name: 'passwordField',
        message: 'Nome do campo senha (ex: password):',
        default: 'password',
        when: (answers) => answers.hasPassword,
      },
      {
        type: 'input',
        name: 'routeName',
        message: 'Rota base (plural) (ex: events):',
        default: (answers) => pluralizeEnLike(kebabCase(answers.featureName)),
      },
      {
        type: 'confirm',
        name: 'autoImportAppModule',
        message: 'Importar o módulo automaticamente no AppModule?',
        default: true,
      },
      {
        type: 'input',
        name: 'appModulePath',
        message: 'Caminho do AppModule:',
        default: 'src/app.module.ts',
        when: (answers) => answers.autoImportAppModule,
      },
    ],

    actions: function (answers) {
      const featureKebab = kebabCase(answers.featureName);
      const featureDir = `src/modules/${featureKebab}`;

      const schemaCtx = buildSchemaDrivenContext({
        schemaPath: answers.schemaPath,
        prismaModel: answers.prismaModel,
        softDelete: answers.softDelete,
      });

      const data = {
        ...answers,
        featureKebab,
        featurePascal: pascalCase(answers.featureName),
        featureCamel: camelCase(answers.featureName),
        ...schemaCtx,
      };

      const actions = [];

      // ===== arquivos comuns (sempre) =====
      actions.push(
        {
          type: 'add',
          path: `${featureDir}/${featureKebab}.module.ts`,
          templateFile: 'plop-templates/crud-v2/module.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/infra/controllers/${featureKebab}.controller.ts`,
          templateFile: 'plop-templates/crud-v2/controller.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/domain/repositories/${featureKebab}.repository.ts`,
          templateFile: 'plop-templates/crud-v2/repository-port.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/application/use-cases/create-${featureKebab}.usecase.ts`,
          templateFile: 'plop-templates/crud-v2/usecases/create.usecase.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/application/use-cases/find-all.usecase.ts`,
          templateFile: 'plop-templates/crud-v2/usecases/find-all.usecase.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/application/use-cases/find-${featureKebab}-by-id.usecase.ts`,
          templateFile:
            'plop-templates/crud-v2/usecases/find-by-id.usecase.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/application/use-cases/update-${featureKebab}.usecase.ts`,
          templateFile: 'plop-templates/crud-v2/usecases/update.usecase.hbs',
          data,
        },
        {
          type: 'add',
          path: `${featureDir}/application/use-cases/delete-${featureKebab}.usecase.ts`,
          templateFile: 'plop-templates/crud-v2/usecases/delete.usecase.hbs',
          data,
        },
      );

      if (answers.hasPassword) {
        actions.push({
          type: 'add',
          path: `${featureDir}/application/services/password.service.ts`,
          templateFile: 'plop-templates/crud-v2/password.service.hbs',
          data,
        });
      }

      // ===== schema-driven vs fallback =====
      if (schemaCtx.hasSchema) {
        // entity tipada + dtos tipados + mapper + prisma repo tipado
        actions.push(
          {
            type: 'add',
            path: `${featureDir}/domain/entities/${featureKebab}.entity.ts`,
            templateFile: 'plop-templates/crud-v2/entity.schema.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/application/dto/create-${featureKebab}.dto.ts`,
            templateFile: 'plop-templates/crud-v2/dtos/create.schema.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/application/dto/update-${featureKebab}.dto.ts`,
            templateFile: 'plop-templates/crud-v2/dtos/update.schema.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/infra/mappers/${featureKebab}.mapper.ts`,
            templateFile: 'plop-templates/crud-v2/mapper.schema.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/infra/prisma/prisma-${featureKebab}.repository.ts`,
            templateFile: 'plop-templates/crud-v2/prisma-repo.schema.hbs',
            data,
          },
        );
      } else {
        // fallback (como você tem hoje)
        actions.push(
          {
            type: 'add',
            path: `${featureDir}/domain/entities/${featureKebab}.entity.ts`,
            templateFile: 'plop-templates/crud-v2/entity.fallback.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/application/dto/create-${featureKebab}.dto.ts`,
            templateFile: 'plop-templates/crud-v2/dtos/create.fallback.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/application/dto/update-${featureKebab}.dto.ts`,
            templateFile: 'plop-templates/crud-v2/dtos/update.fallback.hbs',
            data,
          },
          {
            type: 'add',
            path: `${featureDir}/infra/prisma/prisma-${featureKebab}.repository.ts`,
            templateFile: 'plop-templates/crud-v2/prisma-repo.fallback.hbs',
            data,
          },
        );
      }

      // ===== auto import AppModule =====
      if (answers.autoImportAppModule) {
        actions.push(
          {
            type: 'append',
            path: answers.appModulePath,
            pattern: /(^import\s.+;\s*$)/m,
            template: `\nimport { ${pascalCase(featureKebab)}Module } from './modules/${featureKebab}/${featureKebab}.module';`,
          },
          {
            type: 'append',
            path: answers.appModulePath,
            pattern: /imports:\s*\[/,
            template: `  ${pascalCase(featureKebab)}Module,\n`,
          },
        );
      }

      return actions;
    },
  });
};
