const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  try {
    console.log("Starting MongoMemoryServer on port 27017...");
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'ramya',
        storageEngine: 'ephemeralForTest'
      }
    });
    console.log("MongoMemoryServer successfully started!");
    console.log("URI:", mongoServer.getUri());
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log("Stopping MongoMemoryServer...");
      await mongoServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start MongoMemoryServer:", error);
    process.exit(1);
  }
}

run();
