import { DocumentNode, ExecutionResult, GraphQLSchema, GraphQLDirective } from 'graphql';
export * from 'graphql';

export function graphqlReactive(
  schema: GraphQLSchema,
  requestString: string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string
): AsyncIterator<ExecutionResult>;

export function executeReactive(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string
): AsyncIterator<ExecutionResult>;

export function addReactiveDirectivesToSchema(
  schema: GraphQLSchema,
): void;

export const GraphQLLiveDirective: GraphQLDirective;
export const GraphQLDeferDirective: GraphQLDirective;
