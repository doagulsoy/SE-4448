import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server";
import "dotenv/config";
import { authResolver } from "../resolvers/auth.js";
import { postResolver } from "../resolvers/post.js";
import { schema } from "../graphql/index.js";
import jwt from "jsonwebtoken";
import { mergeResolvers } from "@graphql-tools/merge";
import { commentResolver } from "../resolvers/comment.js";
import { profileResolver } from "../resolvers/profile.js";
import { storyResolver } from "../resolvers/story.js";

const PORT = 4000;

const prisma = new PrismaClient();

const resolvers = [
  authResolver,
  postResolver,
  commentResolver,
  profileResolver,
  storyResolver,
];

const server = new ApolloServer({
  typeDefs: schema,
  context: async ({ req }) => {
    const auth = req.headers.authorization;
    let token = null;
    let user = null;
    if (auth) {
      token = auth.split(" ")[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await prisma.user.findUnique({
          where: {
            id: decoded.id,
          },
        });
        return {
          prisma,
          user,
        };
      } catch (error) {
        throw new Error("User not found!");
      }
    }

    return { prisma, user };
  },
  resolvers: mergeResolvers(resolvers),
});

server.listen({ port: PORT }).then(() => {
  console.log(`
    Server is running!
    Listening on port ${PORT}
    Explore at http://localhost:${PORT}
  `);
});
