# loopback-connector-documentdb

[![Join the chat at https://gitter.im/dzonatan/loopback-connector-documentdb](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dzonatan/loopback-connector-documentdb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Loopback database connector for Microsoft Azure DocumentDB

[![Build Status](https://travis-ci.org/dzonatan/loopback-connector-documentdb.svg)](https://travis-ci.org/dzonatan/loopback-connector-documentdb)
[![Dependency Status](https://gemnasium.com/dzonatan/loopback-connector-documentdb.svg)](https://gemnasium.com/dzonatan/loopback-connector-documentdb)
[![Coverage Status](https://coveralls.io/repos/dzonatan/loopback-connector-documentdb/badge.svg?branch=master&service=github)](https://coveralls.io/github/dzonatan/loopback-connector-documentdb?branch=master)

## Installation for LoopBack API

Install documentdb connector as a npm dependency:
```
npm install loopback-connector-documentdb --save
```

Create datasource using documentdb connector:
```
slc loopback:datasource documentdb
```
```
Enter the data-source name: documentdb
Select the connector for documentdb: other
Enter the connector name without the loopback-connector- prefix: documentdb
```

Open *server/datasources.json* file and add 3 additional properties to documentdb datasource:
```
...
"masterKey": "YOUR MASTER KEY FROM AZURE PORTAL",
"databaseId": "DATABASE ID",
"collectionId": "COLLECTION ID"
...
```
**All those properties are required!** If you don't have yet any *database* and/or *collection* created you can create them manually via [Azure Portal](https://portal.azure.com).
