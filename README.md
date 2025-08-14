
<p align="center">
    <img src="https://img.shields.io/badge/express-%3E%3D%204.0.0-blue" alt="Express version >= 4.0.0"/>
    <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License MIT"/>
    <img src="https://img.shields.io/npm/dm/@mrsafalpiya/node-telescope" alt="Downloads"/>
    <img src="https://img.shields.io/github/actions/workflow/status/mrsafalpiya/node-telescope/node.js.yml" alt="Build">
</p>

## THIS IS A FORK!

Damian Chojnacki <damianchojnacki@op.pl> (https://damianchojnacki.com) is the original creator of this package and the original repository is located at
https://github.com/damianchojnacki/telescope. Then ASU LE forked the project as a continuation of the original project, with some new enhancements,
updates to NPM packages, and some bug fixes.

## Introduction
Node.js Telescope is an elegant debug assistant based on Telescope for Laravel framework. 
Telescope provides insight into the requests coming into your application, 
exceptions, console.log entries, variable dumps, and more. Telescope makes a 
wonderful companion to your local development environment.

## Docs
### 1. Installation

```npm
npm i @mrsafalpiya/node-telescope
```

### 2. Usage
Setup Telescope BEFORE any route. Set up ErrorWatcher if needed at the end.

```javascript
import Telescope, { ErrorWatcher } from '@mrsafalpiya/node-telescope'

const app = express()

const telescope = Telescope.setup(app)

app.get('/', (request, response) => {
    response.send('Hello world')
})

ErrorWatcher.setup(telescope)
```

Now you can access telescope panel at `/telescope`.

#### RequestWatcher

Intercepts requests and responses.

#### LogWatcher

Intercepts console messages.

`console.log` - creates `info` level log
`console.warn` - creates `warning` level log
`console.table` - creates `info` level table log

```javascript
console.log(message, ...content)
```

#### ClientRequestWatcher

Intercepts axios requests and responses.

#### ErrorWatcher

Logs unhandled errors.

#### DumpWatcher

Saves dump messages.

```javascript
import { dump } from "@mrsafalpiya/node-telescope"

dump("foo")
```

### 3. Note about ErrorWatcher (only express < 5.0.0)

Unhandled exception thrown in async function causes that Telescope will is unable to create associated request:
See [Express docs](http://expressjs.com/en/advanced/best-practice-performance.html#use-promises) <br><br>
`WRONG ❌`
```javascript
app.get('/', async (request, response) => {
    await someAsyncFuncThatThrowsException()
    
    response.send('Hello world')
})
```

`GOOD ✅`
```javascript
app.get('/', async (request, response, next) => {
    try{
        await someAsyncFuncThatThrowsException()
    } catch(error) {
        next(error)
    }
    
    response.send('Hello world')
})
```
### 4. Configuration

#### Enabled watchers

```javascript
Telescope.setup(app, {
    enabledWatchers: {
        RequestWatcher,
        ErrorWatcher,
        ClientRequestWatcher,
        DumpWatcher,
        LogWatcher,
    },
    enableClient: true,
    responseSizeLimit: 128,
    paramsToHide: [
        'password',
        '_csrf'
    ],
    ignorePaths: [
        '/admin*',
        '/docs'
    ],
    ignoreErrors: [
        TypeError
    ],
    isAuthorized: (request, response, next) => {
        if(!request.isAuthenticated()){
            response.redirect('/login')

            return
        }
        
        next()
    },
    getUser: (request) => request.user, // {id: 1, email: 'user@example.com', name: 'John'}
})
```
`enabledWatchers` - list of enabled watchers

`enableClient` - enables client side telescope, which is enabled by default

`responseSizeLimit` - response size limit (KB).
If the limit is exceeded, the watcher will not log the response body.

`paramsToHide` - filter sensitive data,
If paramsToFilter matches request param it will be converted to *******.

`ignorePaths` - paths to ignore, exact paths or wildcard can be specified

`ignoreErrors` - errors to ignore

`isAuthorized` - be default telescope is disabled on production, if you want to change this behaviour you can provide custom isAuthorized function

`getUser` - telescope will display provided user on the request preview page, id is required, name and email are optional

### TypeORM Logging

TypeORM logging is a bit more setup than other logging. You must add the `TypeORMWatcher` to the list of enabled watchers,
and then you must pass the `logger` option to the TypeORM connection options. This is an example of how it would look in
NestJS:

```javascript
const dataSourceConfig: any = {
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    logger: new TypeORMLogger(), // This line must be added to log the queries
};
```


### Database drivers
Customizing database driver:
```javascript
import { MemoryDriver } from "@mrsafalpiya/node-telescope"

const telescope = Telescope.setup(app, {
    databaseDriver: MemoryDriver
})
```

At the moment available are two drivers:
1. LowDriver (LowDB) - data is stored in json file and persist between application restart.
2. MemoryDriver - data is stored in memory and will be lost after application restart.

Feel free to create custom driver. It must implement `DatabaseDriver`:
```typescript
get<T extends WatcherType>(name: WatcherEntryCollectionType, take?: number): Promise<WatcherEntry<T>[]>

find<T extends WatcherType>(name: WatcherEntryCollectionType, id: string): Promise<WatcherEntry<T> | undefined>

batch(batchId: string): Promise<WatcherEntry<any>[]>

save<T extends WatcherType>(name: WatcherEntryCollectionType, data: WatcherEntry<T>): Promise<void>

update<T extends keyof WatcherType>(name: WatcherEntryCollectionType, index: number, toUpdate: WatcherEntry<T>): Promise<void>

truncate(): Promise<void>
```

## License

Node.js Telescope is open-sourced software licensed under the [MIT license](LICENSE.md).
