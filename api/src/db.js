import mongo from 'mongodb';

const { MongoClient } = mongo;

// In case DB password contains special characters
const url = encodeURI(process.env.MONGO_URL);

// Create our Mongo Client to connect to the DB
export const client = new MongoClient(url, { useNewUrlParser: true });

export async function connectDB() {
  try {
    await client.connect();

    // Confirm db connection
    await client.db('admin').command({ ping: 1 });
    console.log('🗄️  Connected to DB Success');
  } catch (error) {
    console.error(error);

    // If there is a problem, close connection to the db
    await client.close();
  }
}