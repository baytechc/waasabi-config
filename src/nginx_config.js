export default (setup) => `
server {
  listen 80;
  listen [::]:80;

  ${setup.instance.type=='local' ? '#' :''}server_name ${setup.host};

  # Live page root
  root /home/waasabi/live/_site/;

  # Strapi redirect
  location /waasabi/ {
    proxy_set_header        Host $host;
    proxy_set_header        X-Real-IP $remote_addr;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header        X-Forwarded-Proto $scheme;

    rewrite     /waasabi(.*) $1 break;
    proxy_pass  http://localhost:1337;
    proxy_read_timeout  90;

    # Max upload size
    client_max_body_size 100M;
  }

  # GraphQL & WebSockets
  location /graphql {
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET,POST";
    add_header Access-Control-Allow-Headers "apollo-query-plan-experimental,authorization,content-type,x-apollo-tracing";
    add_header Access-Control-Expose-Headers "Authorization, *";

    proxy_pass http://localhost:1337;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 1d;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

`.trim()+'\n';