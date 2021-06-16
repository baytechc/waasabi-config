// Custom midlleware config to enable unparsed POST bodies (for verifying webhook signatures)
// https://strapi.io/documentation/v3.x/concepts/middlewares.html#core-middleware-configurations

export default (setup) => `module.exports = ({ env }) => ({
  settings: {
    router: {
      prefix: env("ROUTER_PREFIX", "/waasabi"),
    },
    parser: {
      multipart: true,
      includeUnparsed: true,
    }
  }
});
`