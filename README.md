## Build
> yarn export

or

> npm run export

## Config

### Publish on github
- **config.js**
> const mode = 'github'<br/>
baseURL = '**https://neoburger.github.io**'<br/>
basePath = '**/web**'

### Publish on server
- **config.js**
> const mode = 'server'<br/>
baseURL = '**http://domain**'<br/>
basePath = ''

### Debug by local
- **config.js**
> const mode = 'dev'<br/>
baseURL = '/'<br/>
basePath = ''
- **run**
> yarn dev
- **browser**
> localhost:3000