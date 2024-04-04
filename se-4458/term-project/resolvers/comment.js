import { ApolloError } from "apollo-server";

export const commentResolver = {
  Query: {
    replies: async (parent, args, { prisma, postId }, info) => {
      try {
        const replies = await prisma.post_replies.findMany({
          where: {
            post_id: postId,
          },
          orderBy: {
            created_at: "desc",
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
          },
        });
        console.log(replies);
        return replies;
      } catch (error) {
        console.log(error.message);
        throw new ApolloError("Something went wrong..");
      }
    },
  },

  Mutation: {
    createComment: async (
      parent,
      { postId, content },
      { prisma, user },
      info
    ) => {
      try {
        let post = await prisma.post.findUnique({
          where: {
            id: postId,
          },
        });
        if (!post) {
          throw new ApolloError("Post not found!");
        }

        const reply = await prisma.post_replies.create({
          data: {
            content: content,
            post_id: postId,
            user_id: user.id,
          },
        });

        await prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            comments_count: post.comments_count + 1,
          },
        });
        const comment = await prisma.post_replies.findFirst({
          where: {
            id: reply.id,
          },
          include: {
            post: {
              select: {
                id: true,
                file: true,
                content: true,
                like_count: true,
                comments_count: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profile_photo: true,
              },
            },
          },
        });
        post = await prisma.post.findUnique({
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
        console.log("id:", reply.id);
        console.log("Comment created successfully");
        console.log(post);
        return post;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    updateComment: async (
      parent,
      { commentId, content },
      { prisma, user },
      info
    ) => {
      try {
        let comment = await prisma.post_replies.findFirst({
          where: {
            id: commentId,
          },
        });
        if (!comment) {
          throw new ApolloError("Comment not found!");
        }
        if (comment.user_id != user.id) {
          throw new ApolloError("Not authenticated");
        }

        comment = await prisma.post_replies.update({
          where: {
            id: commentId,
          },
          data: {
            content: content,
          },
        });
        return comment;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    deleteComment: async (parent, { commentId }, { prisma, user }, info) => {
      try {
        const comment = await prisma.post_replies.findFirst({
          where: {
            id: commentId,
          },
        });
        if (!comment) {
          throw new ApolloError("Comment not found");
        }
        const replyLikes = await prisma.reply_likes.findMany({
          where: {
            reply_id: commentId,
          },
        });
        if (replyLikes.length > 0) {
          await prisma.reply_likes.deleteMany({
            where: {
              reply_id: commentId,
            },
          });
        }
        if (comment.user_id != user.id) {
          throw new ApolloError("Not authenticated");
        }

        await prisma.post_replies.delete({
          where: {
            id: commentId,
          },
        });
        console.log(comment);
        console.log("Comment deleted successfully!");
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    likeComment: async (parent, { commentId }, { prisma, user }, info) => {
      try {
        const comment = await prisma.post_replies.findUnique({
          where: {
            id: commentId,
          },
        });
        if (!comment) {
          throw new ApolloError("Comment not found!");
        }
        let like = await prisma.reply_likes.findFirst({
          where: {
            reply_id: commentId,
            user_id: user.id,
          },
        });
        if (like) {
          throw new ApolloError("Comment already liked!");
        }
        like = await prisma.reply_likes.create({
          data: {
            reply_id: commentId,
            user_id: user.id,
          },
        });

        await prisma.post_replies.update({
          where: {
            id: commentId,
          },
          data: {
            like_count: comment.like_count + 1,
          },
        });
        console.log(like);
        return like;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    unlikeComment: async (parent, { commentId }, { prisma, user }, info) => {
      try {
        const comment = await prisma.post_replies.findUnique({
          where: {
            id: commentId,
          },
        });
        if (!comment) {
          throw new ApolloError("Comment not found");
        }
        const like = await prisma.reply_likes.findFirst({
          where: {
            reply_id: commentId,
            user_id: user.id,
          },
        });
        if (!like) {
          throw new ApolloError("Post not liked");
        }
        const deleteLike = await prisma.reply_likes.delete({
          where: {
            id: like.id,
          },
        });
        await prisma.post_replies.update({
          where: {
            id: commentId,
          },
          data: {
            like_count: comment.like_count - 1,
          },
        });
        console.log("Unliked successfully");
        console.log(deleteLike);
        return deleteLike;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    createReply: async (
      parent,
      { commentId, content },
      { prisma, user },
      info
    ) => {
      try {
        const comment = await prisma.post_replies.findUnique({
          where: {
            id: commentId,
          },
        });
        console.log(comment);
        if (!comment) {
          throw new ApolloError("Comment not found");
        }
        let reply = await prisma.post_replies.create({
          data: {
            content: content,
            post: { connect: { id: comment.post_id } },
            user: { connect: { id: user.id } },
            original_reply: { connect: { id: comment.id } },
          },
        });
        await prisma.post_replies.update({
          where: {
            id: commentId,
          },
          data: {
            comments_count: comment.comments_count + 1,
          },
        });
        reply = await prisma.post_replies.findFirst({
          where: {
            id: reply.id,
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
          },
        });
        console.log("Reply created successfully");
        console.log(reply);
        return reply;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    updateReply: async (
      parent,
      { replyId, content },
      { prisma, user },
      info
    ) => {
      try {
        let reply = await prisma.post_replies.findFirst({
          where: {
            id: replyId,
          },
        });
        if (!reply) {
          throw new ApolloError("Reply not found!");
        }
        if (reply.user_id != user.id) {
          throw new ApolloError("Not authenticated");
        }

        reply = await prisma.post_replies.update({
          where: {
            id: replyId,
          },
          data: {
            content: content,
          },
        });
        return reply;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    deleteReply: async (parent, { replyId }, { prisma, user }, info) => {
      try {
        const reply = await prisma.post_replies.findFirst({
          where: {
            id: replyId,
          },
        });
        if (!reply) {
          throw new ApolloError("Reply not found");
        }
        const replyLikes = await prisma.reply_likes.findMany({
          where: {
            reply_id: replyId,
          },
        });
        if (replyLikes.length > 0) {
          await prisma.reply_likes.deleteMany({
            where: {
              reply_id: replyId,
            },
          });
        }
        if (reply.user_id != user.id) {
          throw new ApolloError("Not authenticated");
        }
        await prisma.post_replies.delete({
          where: {
            id: replyId,
          },
        });
        console.log("Reply deleted successfully!");
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    likeReply: async (parent, { replyId }, { prisma, user }, info) => {
      try {
        const reply = await prisma.post_replies.findUnique({
          where: {
            id: replyId,
          },
        });
        if (!reply) {
          throw new ApolloError("Reply not found");
        }
        let like = await prisma.reply_likes.findFirst({
          where: {
            reply_id: replyId,
            user_id: user.id,
          },
        });

        if (like) {
          throw new ApolloError("Reply already liked");
        }

        const likeReply = await prisma.reply_likes.create({
          data: {
            user_id: user.id,
            reply_id: replyId,
          },
        });
        await prisma.post_replies.update({
          where: {
            id: replyId,
          },
          data: {
            like_count: reply.like_count + 1,
          },
        });
        console.log(likeReply);
        return likeReply;
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
  },
};
