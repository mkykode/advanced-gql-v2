import type {GraphQLResolveInfo} from 'graphql'
import type {
  User as UserModel,
  Post as PostModel,
  Settings as SettingsModel,
  Invite as InviteModel,
  Context
} from '../types.ts'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: {input: string; output: string}
  String: {input: string; output: string}
  Boolean: {input: boolean; output: boolean}
  Int: {input: number; output: number}
  Float: {input: number; output: number}
}

export type AuthUser = {
  __typename?: 'AuthUser'
  token: Scalars['String']['output']
  user: User
}

export type Invite = {
  __typename?: 'Invite'
  createdAt: Scalars['String']['output']
  email: Scalars['String']['output']
  from: User
  role: Role
}

export type InviteInput = {
  email: Scalars['String']['input']
  role: Role
}

export type Item = {
  __typename?: 'Item'
  task: Scalars['String']['output']
}

export type Mutation = {
  __typename?: 'Mutation'
  createPost: Post
  invite: Invite
  signin: AuthUser
  signup: AuthUser
  updateMe?: Maybe<User>
  updateSettings: Settings
}

export type MutationCreatePostArgs = {
  input: NewPostInput
}

export type MutationInviteArgs = {
  input: InviteInput
}

export type MutationSigninArgs = {
  input: SigninInput
}

export type MutationSignupArgs = {
  input: SignupInput
}

export type MutationUpdateMeArgs = {
  input: UpdateUserInput
}

export type MutationUpdateSettingsArgs = {
  input: UpdateSettingsInput
}

export type NewPostInput = {
  message: Scalars['String']['input']
}

export type Post = {
  __typename?: 'Post'
  author: User
  createdAt: Scalars['String']['output']
  id: Scalars['ID']['output']
  likes: Scalars['Int']['output']
  message: Scalars['String']['output']
  views: Scalars['Int']['output']
}

export type Query = {
  __typename?: 'Query'
  feed: Array<Maybe<Post>>
  me: User
  post: Post
  posts: Array<Maybe<Post>>
  userSettings: Settings
}

export type QueryPostArgs = {
  id: Scalars['ID']['input']
}

export type Role = 'ADMIN' | 'GUEST' | 'MEMBER'

export type Settings = {
  __typename?: 'Settings'
  emailNotifications: Scalars['Boolean']['output']
  id: Scalars['ID']['output']
  pushNotifications: Scalars['Boolean']['output']
  theme: Theme
  user: User
}

export type SigninInput = {
  email: Scalars['String']['input']
  password: Scalars['String']['input']
}

export type SignupInput = {
  email: Scalars['String']['input']
  password: Scalars['String']['input']
  role: Role
}

export type Subscription = {
  __typename?: 'Subscription'
  newPost: Post
}

export type Theme = 'DARK' | 'LIGHT'

export type UpdateSettingsInput = {
  emailNotifications?: InputMaybe<Scalars['Boolean']['input']>
  pushNotifications?: InputMaybe<Scalars['Boolean']['input']>
  theme?: InputMaybe<Theme>
}

export type UpdateUserInput = {
  avatar?: InputMaybe<Scalars['String']['input']>
  email?: InputMaybe<Scalars['String']['input']>
  verified?: InputMaybe<Scalars['Boolean']['input']>
}

export type User = {
  __typename?: 'User'
  avatar: Scalars['String']['output']
  createdAt: Scalars['String']['output']
  email: Scalars['String']['output']
  id: Scalars['ID']['output']
  posts: Array<Maybe<Post>>
  role: Role
  settings: Settings
  verified: Scalars['Boolean']['output']
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    {[key in TKey]: TResult},
    TParent,
    TContext,
    TArgs
  >
  resolve?: SubscriptionResolveFn<
    TResult,
    {[key in TKey]: TResult},
    TContext,
    TArgs
  >
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>
> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AuthUser: ResolverTypeWrapper<
    Omit<AuthUser, 'user'> & {user: ResolversTypes['User']}
  >
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
  ID: ResolverTypeWrapper<Scalars['ID']['output']>
  Int: ResolverTypeWrapper<Scalars['Int']['output']>
  Invite: ResolverTypeWrapper<InviteModel>
  InviteInput: InviteInput
  Item: ResolverTypeWrapper<Item>
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>
  NewPostInput: NewPostInput
  Post: ResolverTypeWrapper<PostModel>
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>
  Role: Role
  Settings: ResolverTypeWrapper<SettingsModel>
  SigninInput: SigninInput
  SignupInput: SignupInput
  String: ResolverTypeWrapper<Scalars['String']['output']>
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>
  Theme: Theme
  UpdateSettingsInput: UpdateSettingsInput
  UpdateUserInput: UpdateUserInput
  User: ResolverTypeWrapper<UserModel>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthUser: Omit<AuthUser, 'user'> & {user: ResolversParentTypes['User']}
  Boolean: Scalars['Boolean']['output']
  ID: Scalars['ID']['output']
  Int: Scalars['Int']['output']
  Invite: InviteModel
  InviteInput: InviteInput
  Item: Item
  Mutation: Record<PropertyKey, never>
  NewPostInput: NewPostInput
  Post: PostModel
  Query: Record<PropertyKey, never>
  Settings: SettingsModel
  SigninInput: SigninInput
  SignupInput: SignupInput
  String: Scalars['String']['output']
  Subscription: Record<PropertyKey, never>
  UpdateSettingsInput: UpdateSettingsInput
  UpdateUserInput: UpdateUserInput
  User: UserModel
}

export type AuthDirectiveArgs = {
  requires?: Maybe<Role>
}

export type AuthDirectiveResolver<
  Result,
  Parent,
  ContextType = Context,
  Args = AuthDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type FormatDateDirectiveArgs = {
  format?: Maybe<Scalars['String']['input']>
}

export type FormatDateDirectiveResolver<
  Result,
  Parent,
  ContextType = Context,
  Args = FormatDateDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type LogDirectiveArgs = {
  message?: Maybe<Scalars['String']['input']>
}

export type LogDirectiveResolver<
  Result,
  Parent,
  ContextType = Context,
  Args = LogDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type AuthUserResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['AuthUser'] = ResolversParentTypes['AuthUser']
> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>
}

export type InviteResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['Invite'] = ResolversParentTypes['Invite']
> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  from?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>
}

export type ItemResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes['Item'] = ResolversParentTypes['Item']
> = {
  task?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type MutationResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  createPost?: Resolver<
    ResolversTypes['Post'],
    ParentType,
    ContextType,
    RequireFields<MutationCreatePostArgs, 'input'>
  >
  invite?: Resolver<
    ResolversTypes['Invite'],
    ParentType,
    ContextType,
    RequireFields<MutationInviteArgs, 'input'>
  >
  signin?: Resolver<
    ResolversTypes['AuthUser'],
    ParentType,
    ContextType,
    RequireFields<MutationSigninArgs, 'input'>
  >
  signup?: Resolver<
    ResolversTypes['AuthUser'],
    ParentType,
    ContextType,
    RequireFields<MutationSignupArgs, 'input'>
  >
  updateMe?: Resolver<
    Maybe<ResolversTypes['User']>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateMeArgs, 'input'>
  >
  updateSettings?: Resolver<
    ResolversTypes['Settings'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateSettingsArgs, 'input'>
  >
}

export type PostResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']
> = {
  author?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  likes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  views?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
}

export type QueryResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  feed?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType>
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  post?: Resolver<
    ResolversTypes['Post'],
    ParentType,
    ContextType,
    RequireFields<QueryPostArgs, 'id'>
  >
  posts?: Resolver<
    Array<Maybe<ResolversTypes['Post']>>,
    ParentType,
    ContextType
  >
  userSettings?: Resolver<ResolversTypes['Settings'], ParentType, ContextType>
}

export type SettingsResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['Settings'] = ResolversParentTypes['Settings']
> = {
  emailNotifications?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType
  >
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  pushNotifications?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType
  >
  theme?: Resolver<ResolversTypes['Theme'], ParentType, ContextType>
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>
}

export type SubscriptionResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']
> = {
  newPost?: SubscriptionResolver<
    ResolversTypes['Post'],
    'newPost',
    ParentType,
    ContextType
  >
}

export type UserResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = {
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  posts?: Resolver<
    Array<Maybe<ResolversTypes['Post']>>,
    ParentType,
    ContextType
  >
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>
  settings?: Resolver<ResolversTypes['Settings'], ParentType, ContextType>
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type Resolvers<ContextType = Context> = {
  AuthUser?: AuthUserResolvers<ContextType>
  Invite?: InviteResolvers<ContextType>
  Item?: ItemResolvers<ContextType>
  Mutation?: MutationResolvers<ContextType>
  Post?: PostResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Settings?: SettingsResolvers<ContextType>
  Subscription?: SubscriptionResolvers<ContextType>
  User?: UserResolvers<ContextType>
}

export type DirectiveResolvers<ContextType = Context> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>
  formatDate?: FormatDateDirectiveResolver<any, any, ContextType>
  log?: LogDirectiveResolver<any, any, ContextType>
}
