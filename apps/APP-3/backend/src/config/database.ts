
import { Sequelize } from 'sequelize';
import path from 'path';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../../database.sqlite'), // Database file will be in the backend root
  logging: false, // Set to console.log to see SQL queries
});

export const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to SQLite has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true }); // Use alter: true to update tables, but be cautious in production
    console.log("All models were synchronized successfully.");

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    (process as any).exit(1); // Exit process with failure
  }
};
