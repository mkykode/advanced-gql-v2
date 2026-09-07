/**
 * A GraphQL IDE served from our own origin.
 *
 * Apollo's hosted Sandbox runs in an iframe from a public https origin, and
 * Chrome's Local Network Access check blocks public origins from reaching
 * localhost — which kills subscriptions (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS).
 * Serving the IDE from http://localhost means its requests are same-origin and
 * never hit that check.
 */
export const graphiqlHtml = `<!doctype html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; height: 100vh; }</style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
  </head>
  <body>
    <div id="graphiql" style="height: 100vh;">Loading GraphiQL…</div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
    <script>
      const url = location.origin + '/graphql'
      const subscriptionUrl = url.replace(/^http/, 'ws')

      const fetcher = GraphiQL.createFetcher({url, subscriptionUrl})

      ReactDOM.createRoot(document.getElementById('graphiql')).render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true
        })
      )
    </script>
  </body>
</html>
`
