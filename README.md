## Build
> yarn export

## Deploy
> git push

or

> ./deploy.sh

## Config

### Publish on github
- **config.js**
> const mode = 'github'<br/>

### Publish on server
- **config.js**
> const mode = 'server'<br/>

### Debug by local
- **config.js**
> const mode = 'dev'<br/>
- **run**
> yarn dev
- **browser**
> localhost:3000