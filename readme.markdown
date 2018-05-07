[![Build Status](https://travis-ci.org/lsmoura/couchdb.svg?branch=master)](https://travis-ci.org/lsmoura/couchdb)

Zero-dependency couchdb nodejs interface

# Setup

```
const couchdb = require('couchdb');

const db = couchdb({
  hostname: 'localhost', // defaults to 'localhost'
  port: 5984, // defaults to 5984 if secure is false. otherwise it defaults to 443.
  username: 'user', // no default. only sends the authentication header if there is a username or a password
  password: 'user', // no default.
  secure: false, // defaults to false. set to true if you need to make an https connection.
  collection: 'test', // required. no default. collection name to use.
});
```

# Talking to the server

After the server is setup with the instructions above, issue the commands on the sections below.
Every call returns a promise that resolves when the request is successful or rejects otherwise.

The accept response is with the following format:

```
{
  statusCode: 200,
  headers: {},
  data: {}
}
```

## Getting records

```
db.get('test'); // will retrieve http://localhost:5984/test/test
```

## Creating or updating records

### Create a new record

```
db.put('test', { foo: 'bar' });
```

```
db.put({ _id: 'test', foo: 'bar' });
```


### Updating an existing record

```
db.put('test', 'revision-id', { foo: 'bar' });
```

```
db.put({ _id: 'test', _rev: 'revision-id',  foo: 'bar' });
```

# Author

* [Sergio Moura](https://sergio.moura.ca)
