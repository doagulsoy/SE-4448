import { ApolloError } from "apollo-server";
import { uploadImage } from "../utils/cloudinary.js";

export const postResolver = {
  Query: {
    posts: async (parent, args, { prisma, user }, info) => {
      const loggedInUser = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        include: {
          followings: true,
        },
      });
      console.log("loggedInUser", loggedInUser);

      const userPosts = await prisma.post.findMany({
        where: {
          user_id: user.id,
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
              user_id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
          post_replies: {
            select: {
              id: true,
              content: true,
              like_count: true,
              comments_count: true,
              original_reply_id: true,
              created_at: true,
              updated_at: true,

              user: {
                select: {
                  name: true,
                  username: true,
                  profile_photo: true,
                  id: true,
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
      });

      let followingPosts = [];
      let followingIds;
      if (loggedInUser.followings && loggedInUser.followings.length > 0) {
        followingIds = loggedInUser.followings.map(
          (follow) => follow.following_id
        );
        console.log("FOLlowing ids", followingIds);

        followingPosts = await prisma.post.findMany({
          where: {
            user_id: {
              in: followingIds,
            },
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
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile_photo: true,
              },
            },
            post_replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,
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
            likes: {
              select: {
                id: true,
                user_id: true,
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
        });
      }
      console.log("following posts", followingPosts);

      const allPosts = [
        ...userPosts.map((post) => ({
          id: post.id,
          user_id: user.id,
          name: user.name,
          username: user.username,
          post,
        })),
        ...followingPosts.map((post) => ({
          id: post.id,
          user_id: post.user.id,
          name: post.user.id === user.id ? user.name : post.user.name,
          username:
            post.user.id === user.id ? user.username : post.user.username,
          post,
        })),
      ];
      console.log("FOLLOWING POSTS", followingPosts);
      //console.log("all posts", allPosts);

      for (const post of allPosts) {
        const likes = await prisma.post_likes.findMany({
          where: {
            post_id: post.id,
          },
          select: {
            id: true,
            user_id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile_photo: true,
              },
            },
          },
        });
        post.likes = likes;
      }

      allPosts.sort(
        (a, b) => new Date(b.post.created_at) - new Date(a.post.created_at)
      );

      for (const post of allPosts) {
        const saves = await prisma.post_saved.findMany({
          where: {
            post_id: post.id,
          },
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
        });
        post.saves = saves;
      }

      for (const post of allPosts) {
        const postReplies = await prisma.post_replies.findMany({
          where: {
            post_id: post.id,
            original_reply_id: null,
          },
          select: {
            id: true,
            content: true,
            like_count: true,
            comments_count: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile_photo: true,
              },
            },
            replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
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
            reply_likes: {
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
        post.post_replies = postReplies;
      }

      const posts =
        allPosts.length > 0
          ? allPosts.map((post) => ({
              id: post.id,
              user_id: post.user_id,
              username: post.username,
              file: post.post.file,
              content: post.post.content,
              created_at: post.post.created_at,
              like_count: post.post.like_count,
              comments_count: post.post.comments_count,
              user: post.post.user,
              likes: post.likes,
              saves: post.post.saves,
              post_replies: post.post_replies,
            }))
          : [];
      console.log(posts);
      return posts;
    },
    getSinglePost: async (parent, { postId }, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findFirst({
          where: {
            id: postId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profile_photo: true,
              },
            },
            likes: {
              select: {
                id: true,
                user_id: true,
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
            post_replies: {
              select: {
                user_id: true,
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,

                user: {
                  select: {
                    name: true,
                    username: true,
                    profile_photo: true,
                    id: true,
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
                    profile_photo: true,
                  },
                },
              },
            },
            post_tagged: {
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
        console.log(post);
        return post;
      } catch (error) {
        console.log(error);
        return error.message;
      }
    },
  },
  Post: {
    is_liked: async (parent, args, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: parent.id,
          },
        });
        if (!post) {
          throw new Error("Post not found!");
        }

        const like = await prisma.post_likes.findFirst({
          where: {
            post_id: parent.id,
            user_id: user.id,
          },
        });
        if (!like) {
          return false;
        }
        return true;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    is_saved: async (parent, args, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: parent.id,
          },
        });
        if (!post) {
          throw new Error("Post not found!");
        }

        const save = await prisma.post_saved.findFirst({
          where: {
            post_id: parent.id,
            user_id: user.id,
          },
        });
        if (!save) {
          return false;
        }
        return true;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
  },

  Mutation: {
    createPost: async (parent, { file, content }, { prisma, user }, info) => {
      try {
        //const result = await uploadImage(file);
        const post = await prisma.post.create({
          data: {
            user: user.id,
            file: file,
            content: content,
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        const createdPost = await prisma.post.findFirst({
          where: {
            id: post.id,
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

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            post_count: {
              increment: 1,
            },
          },
        });
        console.log(createdPost);
        return createdPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    updatePost: async (parent, args, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: args.postId,
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

        if (!post) {
          throw new Error("Post not found!");
        }

        if (post.user.id !== user.id) {
          throw new Error("Unauthorized!");
        }

        const updatedPost = await prisma.post.update({
          where: {
            id: args.postId,
          },
          data: {
            content: args.content,
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
        console.log(updatedPost);
        return updatedPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    deletePost: async (parent, { postId }, { prisma, user }, info) => {
      console.log("postId: ", postId);
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: postId,
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

        if (!post) {
          throw new Error("Post not found!");
        }

        const likes = await prisma.post_likes.findMany({
          where: {
            post_id: postId,
          },
        });

        if (likes.length > 0) {
          await prisma.post_likes.deleteMany({
            where: {
              post_id: postId,
            },
          });
        }

        const savedPosts = await prisma.post_saved.findMany({
          where: {
            post_id: postId,
          },
        });

        if (savedPosts.length > 0) {
          await prisma.post_saved.deleteMany({
            where: {
              post_id: postId,
            },
          });
        }

        if (user.id != post.user_id) {
          throw new Error("User cannot delete other's post!");
        }

        console.log(post);

        return post;
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    likePost: async (parent, { postId }, { prisma, user }, info) => {
      console.log("postId: ", postId);

      try {
        const post = await prisma.post.findUnique({
          where: {
            id: postId,
          },
        });

        if (!post) {
          throw new Error("Post not found!");
        }

        const like = await prisma.post_likes.findFirst({
          where: {
            post_id: postId,
            user_id: user.id,
          },
        });
        if (like) {
          throw new Error("Post already liked!");
        }

        await prisma.post_likes.create({
          data: {
            post_id: postId,
            user_id: user.id,
          },
        });

        await prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            like_count: post.like_count + 1,
          },
        });

        const likedPost = await prisma.post.findUnique({
          where: {
            id: postId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
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
            post_replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,

                user: {
                  select: {
                    name: true,
                    username: true,
                    profile_photo: true,
                    id: true,
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
                    profile_photo: true,
                  },
                },
              },
            },
          },
        });
        console.log(likedPost);
        return likedPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    unlikePost: async (parent, { postId }, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: postId,
          },
        });
        if (!post) {
          throw new Error("Post not found!");
        }

        const like = await prisma.post_likes.findFirst({
          where: {
            post_id: postId,
            user_id: user.id,
          },
        });
        if (!like) {
          throw new Error("Post not liked!");
        }

        await prisma.post_likes.delete({
          where: {
            id: like.id,
          },
        });
        await prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            like_count: post.like_count - 1,
          },
        });

        const unlikedPost = await prisma.post.findUnique({
          where: {
            id: postId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
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
            post_replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,

                user: {
                  select: {
                    name: true,
                    username: true,
                    profile_photo: true,
                    id: true,
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
                    profile_photo: true,
                  },
                },
              },
            },
          },
        });
        console.log(unlikedPost);
        return unlikedPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    savePost: async (parent, { postId }, { prisma, user }, info) => {
      try {
        const post = await prisma.post.findUnique({
          where: {
            id: postId,
          },
        });

        if (!post) {
          throw new Error("Post not Found!");
        }

        const save = await prisma.post_saved.findFirst({
          where: {
            post_id: postId,
            user_id: user.id,
          },
        });

        if (save) {
          throw new Error("Post already saved!");
        }

        await prisma.post_saved.create({
          data: {
            post_id: postId,
            user_id: user.id,
          },
        });

        const savedPost = await prisma.post.findUnique({
          where: {
            id: post.id,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
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
            post_replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,

                user: {
                  select: {
                    name: true,
                    username: true,
                    profile_photo: true,
                    id: true,
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
                    profile_photo: true,
                  },
                },
              },
            },
          },
        });
        console.log("saved  Post", savedPost);
        return savedPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    unsavePost: async (parent, { postId }, { prisma, user }, info) => {
      try {
        const savedPost = await prisma.post_saved.findFirst({
          where: {
            post_id: postId,
            user_id: user.id,
          },
        });
        if (!savedPost) {
          throw new Error("Post hasn't saved!");
        }
        await prisma.post_saved.delete({
          where: {
            id: savedPost.id,
          },
        });
        const unsavedPost = await prisma.post.findUnique({
          where: {
            id: postId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
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
            post_replies: {
              select: {
                id: true,
                content: true,
                like_count: true,
                comments_count: true,
                original_reply_id: true,
                created_at: true,
                updated_at: true,

                user: {
                  select: {
                    name: true,
                    username: true,
                    profile_photo: true,
                    id: true,
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
                    profile_photo: true,
                  },
                },
              },
            },
          },
        });
        console.log("unsavedPost:  ", unsavedPost);
        console.log("UNSAVED!");
        return unsavedPost;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    tagUser: async (parent, { userId, postId }, { prisma, user }, info) => {
      try {
        const taggedPost = await prisma.post.findUnique({
          where: {
            id: postId,
          },
        });
        if (!taggedPost) {
          throw new Error("Post not found!");
        }

        const findUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

        if (!findUser) {
          throw new Error("User not found!");
        }
        let tag = await prisma.post_tagged.findFirst({
          where: {
            post_id: postId,
            user_id: userId,
          },
        });
        if (tag) {
          throw new ApolloError("Post already  tagged!");
        }
        tag = await prisma.post_tagged.create({
          data: {
            post_id: postId,
            user_id: userId,
          },
        });

        const post = await prisma.post.findFirst({
          where: {
            id: tag.post_id,
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
        console.log("Successfully tagged!");
        console.log(post);
        return post;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    untagUser: async (parent, { userId, postId }, { prisma, user }, info) => {
      try {
        let post = await prisma.post.findFirst({
          where: {
            id: postId,
          },
        });
        if (!post) {
          throw new ApolloError("Post not found!");
        }

        const taggedPost = await prisma.post_tagged.findFirst({
          where: {
            user_id: userId,
            post_id: postId,
          },
        });
        if (!taggedPost) {
          throw new ApolloError("User not tagged!");
        }

        await prisma.post_tagged.delete({
          where: {
            id: taggedPost.id,
          },
        });

        post = await prisma.post.findFirst({
          where: {
            id: postId,
          },
          include: {
            post_tagged: {
              select: {
                post_id: true,
                user_id: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        });
        console.log("Untagged successfully");
        return post;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
  },
};
