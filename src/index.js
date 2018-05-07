const http = require('http');
const https = require('https');

const couchdb = function(options) {
  if (!options) {
    throw new Error('cannot create couchdb object without options.');
  }

  if (!options.collection) {
    throw new Error('need a collection parameter');
  }

  const host = options.host || 'localhost';
  const port = options.port || (options.secure ? 443 : 5984);

  if (options.username || options.password) {
    this.auth = Buffer.from(`${options.username || ''}:${options.password || ''}`).toString('base64');
  }

  this.options = { hostname: host, port };
  this.collection = options.collection;

  this.http = options.secure ? https : http;
};

const makeRequest = (http, optionsParam, data) => new Promise((accept, reject) => {
  let response = Buffer.from('');

  const options = Object.assign({}, optionsParam);

  if (!options.headers) options.headers = {};
  options.headers = Object.assign(
    {},
    options.headers,
    {
      accept: 'application/json',
      'content-type': 'application/json; charset=utf8',
    }
  );

  const req = http.request(options, (res) => {
    res.on('data' , (chunk) => {
      response = Buffer.concat([response, chunk]);
    });
    res.on('end', () => {
      const data = response.toString();

      const responseObject = {
        statusCode: res.statusCode,
        headers: res.headers,
        data: JSON.parse(data),
      };

      if (res.statusCode < 200 || res.statusCode >= 400) {
        reject({
          message: responseObject.data.error,
          response: responseObject,
        });
        return;
      }

      accept(responseObject);
    });
  });

  req.on('error', reject);

  req.end(data);
});

couchdb.prototype.create_db = function() {
  const path = `/${this.collection}`;

  const options = Object.assign(
    {},
    this.options,
    {
      method: 'PUT',
      path,
    }
  );

  if (this.auth) {
    options.headers = { Authorization: `Basic ${this.auth}` };
  }

  return makeRequest(this.http, options);
};

couchdb.prototype.delete_db = function() {
  const path = `/${this.collection}`;

  const options = Object.assign(
    {},
    this.options,
    {
      method: 'DELETE',
      path,
    }
  );

  if (this.auth) {
    options.headers = { Authorization: `Basic ${this.auth}` };
  }

  return makeRequest(this.http, options);
};

couchdb.prototype.get = function(id) {
  const path = `/${this.collection}/${id}`;

  const options = Object.assign(
    {},
    this.options,
    {
      method: 'GET',
      path,
    }
  );

  if (this.auth) {
    options.headers = { Authorization: `Basic ${this.auth}` };
  }

  return makeRequest(this.http, options);
};

// Signatures:
// put(id, rev, object) -- pass the id and revision. if `rev` is null, it's ignored.
// put(id, object) -- no revision will be passed, even if present on the object.
// put(object) -- tries to get id and rev from the object. if no `_id` key is present, an error is raised.
couchdb.prototype.put = function(...args) {
  let id = null;
  let rev = null;
  let object = null;
  if (args.length <= 0) {
    throw new Error('couchdb.put() must have at least one argument.');
  }

  if (args.length === 1) {
    if (!args[0] || typeof args[0] !== 'object') {
      throw new Error('couchdb.put() when using the function with only one parameter, it must be an object.');
    }

    object = Object.assign({}, args[0]);
    if (!object._id) {
      throw new Error('couchdb.put() object has no _id key.');
    }

    id = object._id;
    if (object._rev) rev = object._rev;
  } else if (args.length === 2) {
    if (!args[0]) throw new Error('couchdb.put() no id supplied.');
    if (!args[1] || typeof args[1] !== 'object') {
      throw new Error('couchdb.put() when using the function with two parameters, the second one must be an object.');
    }

    id = args[0];
    object = Object.assign({}, args[1]);
  } else {
    if (!args[0]) throw new Error('couchdb.put() no id supplied.');
    if (!args[2] || typeof args[2] !== 'object') {
      throw new Error('couchdb.put() when using the function with three parameters, the third one must be an object.');
    }

    id = args[0];
    rev = args[1];
    object = Object.assign({}, args[2]);
  }

  if (typeof id !== 'string') {
    throw new Error(`invalid type for id. Expected string, got ${typeof id}.`);
  }
  if (rev && typeof rev !== 'string') {
    throw new Error(`invalid type for rev. Expected string, got ${typeof rev}.`);
  }

  delete object._id;
  delete object._rev;

  let path = `/${this.collection}/${id}`;
  if (rev) path += `?rev=${rev}`;

  const options = Object.assign(
    {},
    this.options,
    {
      method: 'PUT',
      path,
    }
  );

  if (this.auth) {
    options.headers = { Authorization: `Basic ${this.auth}` };
  }

  return makeRequest(
    this.http,
    options,
    Buffer.from(JSON.stringify(object))
  );
};

module.exports = couchdb;
