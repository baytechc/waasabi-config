// Custom midlleware config to enable unparsed POST bodies (for verifying webhook signatures)
// https://strapi.io/documentation/v3.x/concepts/middlewares.html#core-middleware-configurations

const config = {
  settings: {
    parser: {
      multipart: true,
      includeUnparsed: true,
    }
  }
};

export default (setup) => `module.exports=${JSON.stringify(config)};`;
