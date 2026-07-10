import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ MongoDB connection failed: MONGO_URI is not set");
    process.exit(1);
  }

  try {
    // Prevent mongoose buffering if DB is not connected
    mongoose.set("bufferCommands", false);

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    return conn;

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

// import mongoose from "mongoose";

// const connectDB = async () => {
//   const mongoUri = process.env.MONGO_URI;

//   if (!mongoUri) {
//     console.error("MongoDB connection failed: MONGO_URI is not set");
//     process.exit(1);
//   }

//   // Fail fast instead of buffering model ops when DB is not connected.
//   mongoose.set("bufferCommands", false);

//   try {
//     const conn = await mongoose.connect(mongoUri, {
//       autoIndex: true,
//       serverSelectionTimeoutMS: 15000
//     });

//     console.log(`MongoDB connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);
//     process.exit(1);
//   }
// };

// export default connectDB;
