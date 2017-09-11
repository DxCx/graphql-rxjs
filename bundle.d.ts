import {
  DocumentNode,
  ExecutionResult,
  GraphQLSchema,
  GraphQLDirective,
  GraphQLFieldResolver,
} from 'graphql';
export * from 'graphql';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { TeardownLogic } from 'rxjs/Subscription';

export function graphqlReactive(
  schema: GraphQLSchema,
  requestString: string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string
): Promise<AsyncIterator<ExecutionResult>>;

export function executeReactive(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
): AsyncIterator<ExecutionResult>;

export function graphqlRx(
  schema: GraphQLSchema,
  requestString: string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
): Observable<ExecutionResult>;

export function executeRx(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
): Observable<ExecutionResult>;

export function subscribeRx(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>
): Observable<ExecutionResult>;

export function prepareSchema(
  schema: GraphQLSchema,
): GraphQLSchema;

export function addReactiveDirectivesToSchema(
  schema: GraphQLSchema,
): void;

export function wrapResolvers(
  schema: GraphQLSchema,
): void;

export function AsyncGeneratorFromObserver<T>(
  subscribe?: (subscriber: Subscriber<T>) => TeardownLogic,
): AsyncIterator<T>;

export const GraphQLLiveDirective: GraphQLDirective;
export const GraphQLDeferDirective: GraphQLDirective;
