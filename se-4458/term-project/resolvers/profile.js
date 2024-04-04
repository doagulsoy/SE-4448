import { ApolloError } from "apollo-server";
import { uploadProfilePhoto } from "../utils/cloudinary.js";

export const profileResolver = {
  Query: {
    getUserProfile: async (_, { username }, { prisma, user }) => {
      try {
        const profileUser = await prisma.user.findUnique({
          where: {
            username: username,
          },
          include: {
            posts: {
              include: {
                user: true,
                likes: {
                  include: {
                    user: true,
                  },
                },
                saves: {
                  include: {
                    user: true,
                  },
                },
                post_replies: {
                  include: {
                    user: true,
                  },
                },
                post_tagged: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            likedPosts: {
              include: {
                user: true,
                post: {
                  include: {
                    user: true,
                    likes: {
                      include: {
                        user: true,
                      },
                    },
                    saves: {
                      include: {
                        user: true,
                      },
                    },
                    post_replies: {
                      include: {
                        user: true,
                      },
                    },
                    post_tagged: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
            savedPosts: {
              include: {
                user: true,
                post: {
                  include: {
                    user: true,
                    likes: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
            taggedPosts: {
              include: {
                user: true,
                post: {
                  include: {
                    user: true,
                    likes: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
            followers: {
              select: {
                id: true,
              },
            },
            followings: {
              select: {
                id: true,
              },
            },
            post_replies: {
              include: {
                user: true,
              },
            },
          },
        });

        if (profileUser) {
          const enrichedProfileUser = {
            ...profileUser,
            created_at: profileUser.created_at.toISOString(),
            updated_at: profileUser.updated_at.toISOString(),
          };
          console.log(enrichedProfileUser);
          return [enrichedProfileUser];
        } else {
          return [];
        }
      } catch (error) {
        console.log(error.message);
        return [];
      }
    },
  },
  Mutation: {
    profilePosts: async (_, { userId }, { prisma, user }) => {
      try {
        const posts = await prisma.post.findMany({
          where: {
            user_id: userId,
          },
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            file: true,
            content: true,
            created_at: true,
            like_count: true,
            comments_count: true,
            user_id: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            likes: {
              select: {
                id: true,
                user_id: true,
                post_id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
            saves: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        });
        console.log(posts);
        return posts;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    profileStories: async (_, { userId }, { prisma, user }) => {
      try {
        const stories = await prisma.story.findMany({
          where: {
            user_id: userId,
          },
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            file: true,
            like_count: true,
            is_saved: true,
            created_at: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
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
    profileFollowings: async (_, { userId }, { prisma, user }) => {
      try {
        const profileUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });

        const followingIds = await prisma.follows.findMany({
          where: {
            follower_id: userId,
          },
          select: {
            following_id: true,
          },
        });

        const followingInfo = await prisma.user.findMany({
          where: {
            id: {
              in: followingIds.map((following) => following.following_id),
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });
        console.log(followingInfo);
        return followingInfo;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    profileFollowers: async (_, { userId }, { prisma, user }) => {
      try {
        const profileUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });
        const followerIds = await prisma.follows.findMany({
          where: {
            following_id: userId,
          },
          select: {
            follower_id: true,
          },
        });
        const followerInfo = await prisma.user.findMany({
          where: {
            id: {
              in: followerIds.map((follower) => follower.follower_id),
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });
        console.log(followerInfo);
        return followerInfo;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    suggestFollow: async (_, { userId }, { prisma, user }) => {
      try {
        const profileUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });
        const followingIds = await prisma.follows.findMany({
          where: {
            follower_id: userId,
          },
          select: {
            following_id: true,
          },
        });
        const followerIds = await prisma.follows.findMany({
          where: {
            following_id: userId,
          },
          select: {
            follower_id: true,
          },
        });
        const suggestedIds = await prisma.user.findMany({
          where: {
            id: {
              notIn: [
                ...followingIds.map((following) => following.following_id),
                ...followerIds.map((follower) => follower.follower_id),
                userId,
              ],
            },
          },
          select: {
            id: true,
          },
        });
        const suggestedInfo = await prisma.user.findMany({
          where: {
            id: {
              in: suggestedIds.map((suggested) => suggested.id),
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            profile_photo: true,
          },
        });
        console.log(suggestedInfo);
        return suggestedInfo;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    profileSuggest: async (_, { userId }, { prisma, user }) => {
      try {
        const profileUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            name: true,
            username: true,
          },
        });
        const profileUserFollowers = await prisma.follows.findMany({
          where: {
            following_id: userId,
          },
          select: {
            follower_id: true,
          },
        });
        const currentUserFollowings = await prisma.follows.findMany({
          where: {
            follower_id: user.id,
          },
          select: {
            following_id: true,
          },
        });

        const commonFollowings = currentUserFollowings.filter((following) =>
          profileUserFollowers.some(
            (follower) => follower.follower_id === following.following_id
          )
        );

        if (commonFollowings.length > 0) {
          const followingNames = await prisma.user.findMany({
            where: {
              id: {
                in: commonFollowings.map((following) => following.following_id),
              },
            },
            select: {
              name: true,
            },
          });

          const followingNamesList = followingNames.map(
            (following) => following.name
          );
          const followingNamesString = followingNamesList.join(", ");

          const notificationMessage = `${followingNamesString} ${
            followingNamesList.length > 1 ? "are" : "is"
          } following`;
          console.log(notificationMessage);
          return notificationMessage;
        }
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },

    savedPosts: async (_, { userId }, { prisma, user }) => {
      try {
        const savedPosts = await prisma.post_saved.findMany({
          where: {
            user_id: userId,
          },
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            post: {
              select: {
                id: true,
                file: true,
                content: true,
                created_at: true,
                like_count: true,
                comments_count: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
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
                      },
                    },
                  },
                },
                saves: {
                  select: {
                    id: true,
                    post_id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        console.log(savedPosts);
        return savedPosts;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    taggedPosts: async (_, { userId }, { prisma, user }) => {
      try {
        const taggedPosts = await prisma.post_tagged.findMany({
          where: {
            user_id: userId,
          },
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            post: {
              select: {
                id: true,
                file: true,
                content: true,
                created_at: true,
                like_count: true,
                comments_count: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
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
                      },
                    },
                  },
                },
                saves: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        console.log(taggedPosts);
        return taggedPosts;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    likedPosts: async (_, { userId }, { prisma, user }) => {
      try {
        const likedPosts = await prisma.post_likes.findMany({
          where: {
            user_id: userId,
          },
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            post: {
              select: {
                id: true,
                file: true,
                content: true,
                created_at: true,
                like_count: true,
                comments_count: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
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
                      },
                    },
                  },
                },
                saves: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        console.log(likedPosts);
        return likedPosts;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    followUser: async (_, { followId }, { prisma, user }) => {
      try {
        if (followId === user.id) {
          throw new ApolloError("You can't follow yourself");
        }

        const checkUser = await prisma.user.findFirst({
          where: {
            id: followId,
          },
        });
        if (!checkUser) {
          throw new ApolloError("User not found");
        }
        const existingUser = await prisma.follows.findFirst({
          where: {
            follower_id: user.id,
            following_id: followId,
          },
        });
        if (existingUser) {
          throw new ApolloError("Already following this user");
        }
        const followUser = await prisma.follows.create({
          data: {
            follower_id: user.id,
            following_id: followId,
          },
        });
        console.log(followUser);
        return followUser;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    unfollowUser: async (_, { followId }, { prisma, user }) => {
      try {
        if (followId === user.id) {
          throw new ApolloError("You can't unfollow yourself");
        }
        const checkUser = await prisma.user.findFirst({
          where: {
            id: followId,
          },
        });
        if (!checkUser) {
          throw new ApolloError("User not found");
        }

        const existingUser = await prisma.follows.findFirst({
          where: {
            follower_id: user.id,
            following_id: followId,
          },
        });
        if (!existingUser) {
          throw new ApolloError("Not following this user");
        }
        const unfollowUser = await prisma.follows.delete({
          where: {
            id: existingUser.id,
          },
        });
        console.log(unfollowUser);
        return unfollowUser;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    editProfile: async (
      _,
      { userId, description, name, profilePhoto },
      { prisma, user }
    ) => {
      try {
        if (user.id != userId) {
          throw new ApolloError("Not authenticated");
        }
        let upload;
        try {
          upload = await uploadProfilePhoto(profilePhoto);
        } catch (uploadError) {
          console.log("Profile photo upload error:", uploadError);
          throw new ApolloError("Error uploading profile photo");
        }

        const updateUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            name: name,
            description: description,
            profile_photo: upload.secure_url,
          },
        });
        console.log(updateUser);
        return updateUser;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
  },
};
