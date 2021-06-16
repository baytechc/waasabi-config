// TODO: make configurable
export default (setup) => 'export default '+JSON.stringify({
  // The URL of the Waasabi backend
  WAASABI_BACKEND: setup.backend.url ?? `https://${setup.host}/waasabi`,

  // GraphQL WebSocket connection string to the Waasabi backend
  WAASABI_GRAPHQL_WS: setup.backend.gql ?? `wss://${setup.host}/graphql`,

  // External link to sessions (default: do not link)
  WAASABI_SESSION_URL: '',

  // Is chat enabled? What chat system is used?
  WAASABI_CHAT_ENABLED: true,
  WAASABI_CHAT_SYSTEM: 'matrix',

  // Public or invite only Matrix room(s)
  WAASABI_CHAT_INVITES: false,
  WAASABI_CHAT_URL: 'https://matrix.to/#/%23example:matrix.org',

  // The Matrix web client to link to
  WAASABI_MATRIX_CLIENT: 'https://app.element.io/',

  // The Matrix API server to use
  WAASABI_MATRIX_API: 'https://matrix.org/_matrix/',
}, null, 2);
