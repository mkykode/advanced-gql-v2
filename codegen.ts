import type {CodegenConfig} from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // codegen reads the SDL straight out of the gql`` template
  schema: './src/typedefs.ts',
  generates: {
    './src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        // REQUIRED here: by default codegen emits TS `enum` for GraphQL enums,
        // and Node's type stripping cannot handle those —
        // `node src/index.ts` dies with ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
        // This emits string-literal unions instead, which erase cleanly.
        enumsAsTypes: true,

        // keeps generated imports as `import type`, required by
        // verbatimModuleSyntax in tsconfig
        useTypeImports: true,

        // the third resolver argument
        contextType: '../types.ts#Context',

        // Without mappers, codegen assumes a resolver's parent is the GraphQL
        // shape — so Post.author's parent would appear to already hold a full
        // User. It doesn't: the stored row holds a user id string, which is
        // precisely why the field resolver exists. These point codegen at the
        // database shapes instead.
        mappers: {
          User: '../types.ts#User',
          Post: '../types.ts#Post',
          Settings: '../types.ts#Settings',
          Invite: '../types.ts#Invite'
        },
        // our DB types share names with the generated GraphQL types, so the
        // imports would collide. Suffix them: User -> UserModel, etc.
        mapperTypeSuffix: 'Model'
      }
    }
  }
}

export default config
