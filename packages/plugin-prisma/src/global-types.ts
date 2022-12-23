/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import {
  FieldKind,
  FieldMap,
  FieldNullability,
  FieldRef,
  InputFieldMap,
  InputFieldRef,
  InterfaceParam,
  NormalizeArgs,
  OutputType,
  PluginName,
  SchemaTypes,
  ShapeFromTypeParam,
  TypeParam,
} from '@pothos/core';
import { PrismaNodeRef } from './node-ref';
import { prismaModelKey, PrismaObjectRef } from './object-ref';
import { PrismaObjectFieldBuilder as InternalPrismaObjectFieldBuilder } from './prisma-field-builder';
import {
  PrismaClient,
  PrismaConnectionFieldOptions,
  PrismaFieldOptions,
  PrismaFieldWithInputOptions,
  prismaModelName,
  PrismaModelTypes,
  PrismaNodeOptions,
  PrismaObjectFieldOptions,
  PrismaObjectTypeOptions,
  ShapeFromConnection,
  ShapeFromSelection,
} from './types';

import type { PrismaPlugin } from '.';

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      prisma: PrismaPlugin<Types>;
    }

    export interface SchemaBuilderOptions<Types extends SchemaTypes> {
      prisma:
        | {
            filterConnectionTotalCount?: boolean;
            client: PrismaClient;
            exposeDescriptions?:
              | boolean
              | {
                  models?: boolean;
                  fields?: boolean;
                };
          }
        | {
            filterConnectionTotalCount?: boolean;
            client: (ctx: Types['Context']) => PrismaClient;
            dmmf: { datamodel: unknown };
            exposeDescriptions?:
              | boolean
              | {
                  models?: boolean;
                  fields?: boolean;
                };
          };
    }

    export interface UserSchemaTypes {
      PrismaTypes: {};
    }

    export interface ExtendDefaultTypes<PartialTypes extends Partial<UserSchemaTypes>> {
      PrismaTypes: PartialTypes['PrismaTypes'] & {};
    }

    export interface PothosKindToGraphQLType {
      PrismaObject: 'Object';
    }

    export interface FieldOptionsByKind<
      Types extends SchemaTypes,
      ParentShape,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveShape,
      ResolveReturnShape,
    > {
      PrismaObject: PrismaObjectFieldOptions<
        Types,
        ParentShape,
        Type,
        Nullable,
        Args,
        ResolveShape,
        ResolveReturnShape
      >;
    }

    export interface SchemaBuilder<Types extends SchemaTypes> {
      prismaObject: <
        Name extends keyof Types['PrismaTypes'],
        Interfaces extends InterfaceParam<Types>[],
        FindUnique,
        Model extends PrismaModelTypes & Types['PrismaTypes'][Name],
        Include = unknown,
        Select = unknown,
      >(
        name: Name,
        options: PrismaObjectTypeOptions<
          Types,
          Model,
          Interfaces,
          FindUnique,
          Include,
          Select,
          ShapeFromSelection<Model, { select: Select; include: Include }>
        >,
      ) => PrismaObjectRef<Model, ShapeFromSelection<Model, { select: Select; include: Include }>>;

      prismaObjectField: <
        Type extends PrismaObjectRef<PrismaModelTypes, {}> | keyof Types['PrismaTypes'],
        Model extends PrismaModelTypes = Type extends PrismaObjectRef<infer M, {}>
          ? M
          : Types['PrismaTypes'][Type & keyof Types['PrismaTypes']] & PrismaModelTypes,
        Shape extends {} = Type extends PrismaObjectRef<PrismaModelTypes, infer S>
          ? S
          : Model['Shape'] & {
              [prismaModelName]?: Type;
            },
      >(
        type: Type,
        fieldName: string,
        field: (t: PrismaObjectFieldBuilder<Types, Model, false, Shape>) => FieldRef,
      ) => void;

      prismaObjectFields: <
        Type extends PrismaObjectRef<PrismaModelTypes, {}> | keyof Types['PrismaTypes'],
        Model extends PrismaModelTypes = Type extends PrismaObjectRef<infer M, {}>
          ? M
          : Types['PrismaTypes'][Type & keyof Types['PrismaTypes']] & PrismaModelTypes,
        Shape extends {} = Type extends PrismaObjectRef<PrismaModelTypes, infer S>
          ? S
          : Model['Shape'] & {
              [prismaModelName]?: Type;
            },
      >(
        type: Type,
        fields: (t: PrismaObjectFieldBuilder<Types, Model, false, Shape>) => FieldMap,
      ) => void;

      prismaNode: 'relay' extends PluginName
        ? <
            Name extends keyof Types['PrismaTypes'],
            Interfaces extends InterfaceParam<Types>[] = [],
            Include = unknown,
            Select = unknown,
            UniqueField = unknown,
          >(
            name: Name,
            options: PrismaNodeOptions<
              Types,
              Types['PrismaTypes'][Name] & PrismaModelTypes,
              Interfaces,
              Include,
              Select,
              ShapeFromSelection<
                PrismaModelTypes & Types['PrismaTypes'][Name],
                { select: Select; include: Include }
              >,
              UniqueField
            >,
          ) => PrismaNodeRef<
            Types['PrismaTypes'][Name] & PrismaModelTypes,
            ShapeFromSelection<
              PrismaModelTypes & Types['PrismaTypes'][Name],
              { select: Select; include: Include }
            >
          >
        : '@pothos/plugin-relay is required to use this method';
    }

    export interface RootFieldBuilder<
      Types extends SchemaTypes,
      ParentShape,
      Kind extends FieldKind = FieldKind,
    > {
      prismaField: <
        Args extends InputFieldMap,
        TypeParam extends
          | PrismaObjectRef<PrismaModelTypes>
          | keyof Types['PrismaTypes']
          | [keyof Types['PrismaTypes']]
          | [PrismaObjectRef<PrismaModelTypes>],
        Nullable extends FieldNullability<Type>,
        ResolveShape,
        ResolveReturnShape,
        Type extends TypeParam extends [unknown]
          ? [ObjectRef<Model['Shape']>]
          : ObjectRef<Model['Shape']>,
        Model extends PrismaModelTypes = PrismaModelTypes &
          (TypeParam extends [keyof Types['PrismaTypes']]
            ? Types['PrismaTypes'][TypeParam[0]]
            : TypeParam extends [PrismaObjectRef<PrismaModelTypes>]
            ? TypeParam[0][typeof prismaModelKey]
            : TypeParam extends PrismaObjectRef<PrismaModelTypes>
            ? TypeParam[typeof prismaModelKey]
            : TypeParam extends keyof Types['PrismaTypes']
            ? Types['PrismaTypes'][TypeParam]
            : never),
      >(
        options: PrismaFieldOptions<
          Types,
          ParentShape,
          TypeParam,
          Model,
          Type,
          Args,
          Nullable,
          ResolveShape,
          ResolveReturnShape,
          Kind
        >,
      ) => FieldRef<ShapeFromTypeParam<Types, Type, Nullable>>;

      prismaConnection: 'relay' extends PluginName
        ? <
            Type extends PrismaObjectRef<PrismaModelTypes> | keyof Types['PrismaTypes'],
            Nullable extends boolean,
            ResolveReturnShape,
            Args extends InputFieldMap = {},
            Model extends PrismaModelTypes = Type extends PrismaObjectRef<infer T>
              ? T
              : PrismaModelTypes & Types['PrismaTypes'][Type & keyof Types['PrismaTypes']],
            Shape = Type extends PrismaObjectRef<PrismaModelTypes, infer S> ? S : Model['Shape'],
            ConnectionInterfaces extends InterfaceParam<Types>[] = [],
            EdgeInterfaces extends InterfaceParam<Types>[] = [],
          >(
            options: PrismaConnectionFieldOptions<
              Types,
              ParentShape,
              Type,
              Model,
              ObjectRef<Model['Shape']>,
              Nullable,
              Args,
              ResolveReturnShape,
              Kind
            >,
            ...args: NormalizeArgs<
              [
                connectionOptions:
                  | ConnectionObjectOptions<
                      Types,
                      ObjectRef<Shape>,
                      false,
                      false,
                      ResolveReturnShape,
                      ConnectionInterfaces
                    >
                  | ObjectRef<ShapeFromConnection<ConnectionShapeHelper<Types, Shape, false>>>,
                edgeOptions:
                  | ConnectionEdgeObjectOptions<
                      Types,
                      ObjectRef<Shape>,
                      false,
                      ResolveReturnShape,
                      EdgeInterfaces
                    >
                  | ObjectRef<{
                      cursor: string;
                      node?: Shape | null | undefined;
                    }>,
              ],
              0
            >
          ) => FieldRef<ShapeFromConnection<ConnectionShapeHelper<Types, Model['Shape'], Nullable>>>
        : '@pothos/plugin-relay is required to use this method';

      prismaFieldWithInput: 'prisma' extends PluginName
        ? <
            Fields extends Record<string, InputFieldRef<unknown, 'InputObject'>>,
            TypeParam extends
              | PrismaObjectRef<PrismaModelTypes>
              | keyof Types['PrismaTypes']
              | [keyof Types['PrismaTypes']]
              | [PrismaObjectRef<PrismaModelTypes>],
            Type extends TypeParam extends [unknown]
              ? [ObjectRef<Model['Shape']>]
              : ObjectRef<Model['Shape']>,
            ResolveShape,
            ResolveReturnShape,
            ArgRequired extends boolean,
            Args extends Record<string, InputFieldRef<unknown, 'Arg'>> = {},
            Nullable extends FieldNullability<Type> = Types['DefaultFieldNullability'],
            InputName extends string = 'input',
            Model extends PrismaModelTypes = PrismaModelTypes &
              (TypeParam extends [keyof Types['PrismaTypes']]
                ? Types['PrismaTypes'][TypeParam[0]]
                : TypeParam extends [PrismaObjectRef<PrismaModelTypes>]
                ? TypeParam[0][typeof prismaModelKey]
                : TypeParam extends PrismaObjectRef<PrismaModelTypes>
                ? TypeParam[typeof prismaModelKey]
                : TypeParam extends keyof Types['PrismaTypes']
                ? Types['PrismaTypes'][TypeParam]
                : never),
          >(
            options: PrismaFieldWithInputOptions<
              Types,
              ParentShape,
              Kind,
              Args,
              Fields,
              TypeParam,
              Model,
              Type,
              Nullable,
              InputName,
              ResolveShape,
              ResolveReturnShape,
              boolean extends ArgRequired
                ? (Types & { WithInputArgRequired: boolean })['WithInputArgRequired']
                : ArgRequired
            >,
          ) => FieldRef<ShapeFromTypeParam<Types, Type, Nullable>>
        : '@pothos/plugin-prisma is required to use this method';
    }

    export interface ConnectionFieldOptions<
      Types extends SchemaTypes,
      ParentShape,
      Type extends OutputType<Types>,
      Nullable extends boolean,
      EdgeNullability extends FieldNullability<[unknown]>,
      NodeNullability extends boolean,
      Args extends InputFieldMap,
      ResolveReturnShape,
    > {}

    export interface ConnectionObjectOptions<
      Types extends SchemaTypes,
      Type extends OutputType<Types>,
      EdgeNullability extends FieldNullability<[unknown]>,
      NodeNullability extends boolean,
      Resolved,
      Interfaces extends InterfaceParam<Types>[] = [],
    > {}

    export interface ConnectionEdgeObjectOptions<
      Types extends SchemaTypes,
      Type extends OutputType<Types>,
      NodeNullability extends boolean,
      Resolved,
      Interfaces extends InterfaceParam<Types>[] = [],
    > {}

    export interface DefaultConnectionArguments {
      first?: number | null | undefined;
      last?: number | null | undefined;
      before?: string | null | undefined;
      after?: string | null | undefined;
    }

    export interface ConnectionShapeHelper<Types extends SchemaTypes, T, Nullable> {}

    export interface ScopeAuthFieldAuthScopes<
      Types extends SchemaTypes,
      Parent,
      Args extends {} = {},
    > {}
    export interface ScopeAuthContextForAuth<Types extends SchemaTypes, Scopes extends {}> {}

    export interface PrismaObjectFieldBuilder<
      Types extends SchemaTypes,
      Model extends PrismaModelTypes,
      NeedsResolve extends boolean,
      Shape extends object = Model['Shape'],
    > extends InternalPrismaObjectFieldBuilder<Types, Model, NeedsResolve, Shape>,
        RootFieldBuilder<Types, Shape, 'PrismaObject'> {}

    export interface FieldWithInputBaseOptions<
      Types extends SchemaTypes,
      Args extends Record<string, InputFieldRef<unknown, 'Arg'>>,
      Fields extends Record<string, InputFieldRef<unknown, 'InputObject'>>,
      InputName extends string,
      ArgRequired extends boolean,
    > {}
  }
}
