const mongoose = require('mongoose');

async function checkDb() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect('mongodb://127.0.0.1:27017/ramya');
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const products = await db.collection('products').find({}).toArray();
    console.log("Products in DB:", products.length);
    for (const p of products) {
      console.log(`- Slug: ${p.slug}, ID: ${p._id}, Name: ${p.name}, Status: ${p.status}`);
    }

    const coupons = await db.collection('coupons').find({}).toArray();
    console.log("Coupons in DB:", coupons.length);

    const users = await db.collection('users').find({}).toArray();
    console.log("Users in DB:", users.length);
    for (const u of users) {
      console.log(`- Email: ${u.email}, ID: ${u._id}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkDb();
