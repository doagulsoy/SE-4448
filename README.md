This repository contains the backend code for a simplified version of Instagram, built using GraphQL and Prisma.

Features
User Authentication: Users can register, log in, and authenticate using JSON Web Tokens (JWT).
Post Management: Users can create, update, delete, like, and comment on posts.
Story Management: Users can create, view, like, and save stories.
User Profiles: Users have profiles with basic information such as name, username, bio, and profile photo.
Follow System: Users can follow and unfollow other users.
Data Persistence: Data is persisted in a PostgreSQL database using Prisma.

Installation
Clone the repository:
git clone https://github.com/yourusername/instagram-backend.git

Install dependencies:
cd instagram-backend
npm install

Set up environment variables:
Create a .env file in the root directory and add the following:
DATABASE_URL="postgresql://username:password@localhost:5432/instagram"
JWT_SECRET="your_jwt_secret"
Replace username, password, and your_jwt_secret with your own values.

Run the application:
npm start
