import { ApolloError } from "apollo-server";
import { uploadImage } from "../utils/cloudinary.js";

export const storyResolver = {
  Query: {
    getStoryList: async (_, __, { prisma, user }) => {
      const loggedInUser = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        include: {
          followings: {
            select: {
              following_id: true,
            },
          },
        },
      });

      const userIds = [
        user.id,
        ...loggedInUser.followings.map((f) => f.following_id),
      ];

      const allStories = await prisma.story.findMany({
        where: {
          user_id: {
            in: userIds,
          },
        },
        orderBy: [
          {
            created_at: "desc",
          },
        ],
        select: {
          id: true,
          file: true,
          created_at: true,
          like_count: true,
          is_saved: true,
          user_id: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profile_photo: true,
            },
          },
          likes: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profile_photo: true,
                },
              },
            },
          },
        },
      });

      const userStoriesDictionary = {};

      for (const story of allStories) {
        const userId = story.user.id;
        if (!userStoriesDictionary[userId]) {
          userStoriesDictionary[userId] = {
            user: {
              id: story.user.id,
              name: story.user.name,
              username: story.user.username,
              profile_photo: story.user.profile_photo,
            },
            stories: [],
          };
        }
        userStoriesDictionary[userId].stories.push({
          id: story.id,
          file: story.file,
          created_at: story.created_at,
          like_count: story.like_count,
          is_saved: story.is_saved,
          user_id: story.user_id,
          username: story.user.username,
          name: story.user.name,
          profile_photo: story.user.profile_photo,
        });
      }

      const combinedUserStories = Object.values(userStoriesDictionary);

      console.dir(combinedUserStories, { depth: 3 });
      return combinedUserStories;
    },
  },
  Mutation: {
    createStory: async (_, { file }, { prisma, user }) => {
      try {
        const result = await uploadImage(file);
        const story = await prisma.story.create({
          data: {
            user: user.id,
            file: result.secure_url,
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        const createdStory = await prisma.story.findFirst({
          where: {
            id: story.id,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        });
        console.log(createdStory);
        console.log("Story created successfully");
        return createdStory;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    deleteStory: async (_, { storyId }, { prisma, user }) => {
      try {
        let story = await prisma.story.findUnique({
          where: {
            id: storyId,
          },
        });
        if (!story) {
          throw new ApolloError("Story not found");
        }
        if (user.id != story.user_id) {
          throw new ApolloError("Not authenticated");
        }
        const likes = await prisma.story_likes.findMany({
          where: {
            story_id: storyId,
          },
        });
        if (likes.length > 0) {
          await prisma.story_likes.deleteMany({
            where: {
              story_id: storyId,
            },
          });
        }

        if (story.is_saved) {
          await prisma.story.update({
            where: {
              id: storyId,
            },
            data: {
              is_saved: false,
            },
          });
        }

        story = await prisma.story.delete({
          where: {
            id: storyId,
          },
        });
        console.log("Story deleted successfully");
        return story;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    likeStory: async (_, { storyId }, { prisma, user }) => {
      try {
        const isLiked = false;
        let story = await prisma.story.findUnique({
          where: {
            id: storyId,
          },
        });
        if (!story) {
          throw new ApolloError("Story not found");
        }
        const likes = await prisma.story_likes.findMany({
          where: {
            story_id: storyId,
          },
        });
        likes.map((like) =>
          like.user_id == user.id ? (isLiked = true) : (isLiked = false)
        );

        if (isLiked) {
          throw new ApolloError("Story already liked");
        }

        const likedStory = await prisma.story_likes.create({
          data: {
            story_id: storyId,
            user_id: user.id,
          },
        });
        console.log(likedStory);
        console.log("Story liked successfully");
        return likedStory;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    unlikeStory: async (_, { storyId }, { prisma, user }) => {
      try {
        let story = await prisma.story.findUnique({
          where: {
            id: storyId,
          },
        });
        if (!story) {
          throw new ApolloError("Story not found");
        }
        const likes = await prisma.story_likes.findFirst({
          where: {
            story_id: storyId,
            user_id: user.id,
          },
        });
        if (likes.length === 0) {
          throw new ApolloError("Story not liked");
        }
        const likedStory = await prisma.story_likes.delete({
          where: {
            id: likes.id,
          },
        });
        console.log(likedStory);
        return likedStory;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    saveStory: async (_, { storyId }, { prisma, user }) => {
      try {
        let story = await prisma.story.findUnique({
          where: {
            id: storyId,
          },
        });
        if (!story) {
          throw new ApolloError("Story not found");
        }
        if (story.is_saved) {
          throw new ApolloError("Story already saved");
        }
        if (user.id != story.user_id) {
          throw new ApolloError("Not authenticated");
        }
        const savedStory = await prisma.story.update({
          where: {
            id: storyId,
          },
          data: {
            is_saved: true,
          },
        });
        console.log(savedStory);
        console.log("Story saved successfully");
        return savedStory;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    unsaveStory: async (_, { storyId }, { prisma, user }) => {
      try {
        let story = await prisma.story.findUnique({
          where: {
            id: storyId,
          },
        });
        if (!story) {
          throw new ApolloError("Story not found");
        }
        if (!story.is_saved) {
          throw new ApolloError("Story not saved");
        }
        if (user.id != story.user_id) {
          throw new ApolloError("Not authenticated");
        }
        const savedStory = await prisma.story.update({
          where: {
            id: storyId,
          },
          data: {
            is_saved: false,
          },
        });
        console.log(savedStory);
        console.log("Story unsaved successfully");
        return savedStory;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    followingsStory: async (_, { userId }, { prisma, user }) => {
      try {
        const followings = await prisma.follow.findMany({
          where: {
            follower_id: userId,
          },
        });
        const followingsId = followings.map(
          (following) => following.following_id
        );
        const stories = await prisma.story.findMany({
          where: {
            user_id: {
              in: followingsId,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        });
        console.log(stories);
        return stories;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
  },
};
