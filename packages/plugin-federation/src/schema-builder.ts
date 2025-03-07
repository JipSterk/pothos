import { printSubgraphSchema } from '@apollo/subgraph';
import { EntityType, entitiesField, serviceField } from '@apollo/subgraph/dist/types';
import SchemaBuilder, { type MaybePromise, type SchemaTypes } from '@pothos/core';
import {
  GraphQLList,
  type GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  type GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLUnionType,
  isObjectType,
  lexicographicSortSchema,
} from 'graphql';
import { ExternalEntityRef } from './external-ref';
import { type Selection, type SelectionFromShape, selectionShapeKey } from './types';
import { entityMapping, getUsedDirectives, mergeDirectives } from './util';

const schemaBuilderProto = SchemaBuilder.prototype as PothosSchemaTypes.SchemaBuilder<SchemaTypes>;

export function hasResolvableKey(type: GraphQLNamedType) {
  if (Array.isArray(type.extensions?.directives)) {
    return type.extensions?.directives.some(
      (d: { name: string; args: Record<string, unknown> }) =>
        d.name === 'key' && d.args.resolvable !== false,
    );
  }

  const directives = (type.extensions?.directives ?? {}) as {
    key?:
      | {
          resolvable?: boolean;
        }[]
      | {
          resolvable?: boolean;
        };
  };
  if (!('key' in directives)) {
    return false;
  }

  if (Array.isArray(directives.key)) {
    return directives.key.some((d) => d.resolvable !== false);
  }

  return directives.key?.resolvable !== false;
}

schemaBuilderProto.selection = <Shape extends object>(selection: SelectionFromShape<Shape>) => ({
  selection,
  [selectionShapeKey]: {} as unknown as Shape,
});

schemaBuilderProto.keyDirective = <Shape extends object, Resolvable extends boolean = true>(
  key: Selection<Shape>,
  resolvable?: Resolvable,
) => ({
  ...key,
  resolvable,
});

schemaBuilderProto.externalRef = function externalRef<
  Name extends string,
  KeySelection extends Selection<object>,
  Shape extends object = KeySelection[typeof selectionShapeKey],
>(
  name: Name,
  key?: KeySelection | KeySelection[],
  resolveReference?: (
    parent: KeySelection[typeof selectionShapeKey],
    context: {},
    info: GraphQLResolveInfo,
  ) => MaybePromise<Shape | null | undefined>,
) {
  return new ExternalEntityRef<SchemaTypes, Shape, KeySelection>(this, name, {
    key,
    resolveReference,
  });
};

schemaBuilderProto.toSubGraphSchema = function toSubGraphSchema(
  this: PothosSchemaTypes.SchemaBuilder<SchemaTypes>,
  {
    linkUrl = 'https://specs.apollo.dev/federation/v2.6',
    federationDirectives = getUsedDirectives(this),
    ...options
  },
) {
  const schema = this.toSchema({
    ...options,
    extensions: {
      ...options.extensions,
      directives: mergeDirectives(options?.extensions?.directives as {}, [
        {
          name: 'link',
          args: {
            url: linkUrl,
            import: [
              ...federationDirectives,
              options.composeDirectives ? '@composeDirective' : null,
            ].filter(Boolean),
          },
        },
        ...(options.composeDirectives?.map((name) => ({
          name: 'composeDirective',
          args: {
            name,
          },
        })) ?? []),
      ]),
    },
  });
  const queryType = schema.getQueryType();
  const types = schema.getTypeMap();

  queryType?.toConfig();

  const entityTypes = Object.values(types).filter(
    (type) => isObjectType(type) && hasResolvableKey(type),
  );

  const hasEntities = entityTypes.length > 0;

  const newQuery: GraphQLObjectType = new GraphQLObjectType({
    name: queryType?.name ?? 'Query',
    description: queryType?.description,
    astNode: queryType?.astNode,
    extensions: queryType?.extensions,
    fields: () => {
      const updatedEntityType = new GraphQLUnionType({
        ...EntityType.toConfig(),
        types: entityTypes
          .filter(isObjectType)
          .map((type) => (type === queryType ? newQuery : type)),
      });
      return {
        ...(hasEntities && {
          _entities: {
            ...entitiesField,
            type: new GraphQLNonNull(new GraphQLList(updatedEntityType)),
          },
        }),
        _service: {
          ...serviceField,
          resolve: () => ({ sdl }),
        },
        ...queryType?.toConfig().fields,
      };
    },
  });

  const subGraphSchema = new GraphQLSchema({
    query: newQuery,
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType(),
    extensions: schema.extensions,
    directives: schema.getDirectives(),
    extensionASTNodes: schema.extensionASTNodes,
    types: [...Object.values(types).filter((type) => type.name !== 'Query'), newQuery],
  });

  const sorted = lexicographicSortSchema(subGraphSchema);

  const sdl = printSubgraphSchema(sorted);

  return sorted;
};

schemaBuilderProto.asEntity = function asEntity(param, options) {
  if (!entityMapping.has(this)) {
    entityMapping.set(this, new Map());
  }

  this.configStore.onTypeConfig(param, (config) => {
    entityMapping.get(this)!.set(config.name, options);
  });
};
