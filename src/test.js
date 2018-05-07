const couchdb = require('./index');

const DB_NAME = 'some_test';

const options = {
  host: 'localhost',
  collection: DB_NAME,
};

const run_tests = async (options) => {
  const db_local = new couchdb(options);

  await db_local.create_db().catch(err => console.error(err));

  let testObject = { foo: 'bar' };

  await db_local.put('test', testObject);

  testObject = await db_local.get('test');

  const x = 1 + (testObject.data.x || 0);
  await db_local.put(Object.assign({}, testObject.data, { x }));

  testObject = await db_local.get('test');
  if (testObject.data.x !== 1) throw new Error('Error saving object.');

  await db_local.delete_db();
};

run_tests(options);
