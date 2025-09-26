db = db.getSiblingDB('vtexday26');

db.createUser({
  user: 'vtexday26_user',
  pwd: 'vtexday26_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'vtexday26',
    },
  ],
});

db.createCollection('User');
db.createCollection('Session');
db.createCollection('Speaker');
db.createCollection('Sponsor');

print('MongoDB initialized with vtexday26 database and collections');