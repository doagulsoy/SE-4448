import { gql } from "apollo-server";

export const schema = gql`
  type User {
    id: Int!
    name: String!
    username: String!
    email: String!
    post_count: Int!
    followings_count: Int!
    followers_count: Int!
    description: String
    profile_photo: String
    reset_token: String
    posts: [Post!]
    likedPosts: [Post_likes!]
    savedPosts: [Post_saved!]
    taggedPosts: [Post_tagged!]
    followers: [User!]
    followings: [User!]
    post_replies: [Post_replies!]
    created_at: String!
    updated_at: String!
  }

  type Post {
    id: Int!
    file: String!
    content: String
    like_count: Int!
    comments_count: Int!
    user: User!
    user_id: Int!
    likes: [Post_likes!]
    saves: [Post_saved!]
    created_at: String!
    updated_at: String!
    post_tagged: [Post_tagged!]
    post_replies: [Post_replies!]
    is_liked: Boolean!
    is_saved: Boolean!
  }
  type Auth {
    user: User
    token: String
  }

  type Post_replies {
    id: Int!
    user: User!
    user_id: Int!
    post: Post!
    post_id: Int!
    content: String!
    like_count: Int!
    original_reply_id: Int
    comments_count: Int!
    created_at: String!
    updated_at: String!
    replies_likes: [Replies_likes!]
    replies: [Post_replies!]
  }

  type Replies_likes {
    id: Int!
    user: User!
    user_id: Int!
    post_replies: Post_replies!
    reply_id: Int!
    created_at: String!
    updated_at: String!
  }

  type Post_likes {
    id: Int!
    user: User!
    user_id: Int!
    post: Post!
    post_id: Int!
    created_at: String!
    updated_at: String!
  }

  type Post_saved {
    id: Int!
    user: User!
    user_id: Int
    post: Post
    post_id: Int
    created_at: String!
    updated_at: String!
  }

  type Post_tagged {
    id: Int!
    user: User!
    user_id: Int!
    post: Post!
    post_id: Int!
    created_at: String!
    updated_at: String!
  }

  type Story {
    id: Int!
    file: String!
    user: User!
    user_id: Int!
    likes: [Story_likes]
    like_count: Int!
    is_saved: Boolean!
    created_at: String!
    updated_at: String!
  }

  type Story_likes {
    id: Int!
    user: User!
    user_id: Int!
    story: Story!
    story_id: Int!
    created_at: String!
    updated_at: String!
  }

  type Follows {
    id: Int!
    follower: User!
    following: User!
    created_at: String!
    updated_at: String!
  }

  type StoriesResponse {
    user: User!
    stories: [Story!]!
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
    posts: [Post!]!
    post(id: Int!): Post
    authentication: User
    getUserProfile(username: String!): [User]
    replies(postId: Int!): Post_replies
    getStoryList: [StoriesResponse]
    getSinglePost(postId: Int!): Post
  }

  type Mutation {
    register(
      name: String!
      username: String!
      email: String!
      password: String!
    ): Auth
    createPost(file: String!, content: String!): Post!
    updatePost(postId: Int!, content: String!): Post!
    deletePost(postId: Int!): Post!
    likePost(postId: Int!): Post
    unlikePost(postId: Int!): Post
    savePost(postId: Int!): Post
    unsavePost(postId: Int!): Post
    tagUser(userId: Int!, postId: Int!): Post
    untagUser(userId: Int!, postId: Int!): Post
    followUser(followId: Int!): Follows
    unfollowUser(followId: Int!): Follows
    login(identifier: String!, password: String!): Auth
    createComment(postId: Int!, content: String!): Post
    updateComment(commentId: Int!, content: String!): Post_replies
    deleteComment(commentId: Int!): Post_replies
    likeComment(commentId: Int!): Post_replies
    unlikeComment(commentId: Int!): Post_replies
    createReply(commentId: Int!, content: String!): Post_replies
    updateReply(replyId: Int!, content: String!): Post_replies
    deleteReply(replyId: Int!): Post_replies
    likeReply(replyId: Int!): Post_replies
    profilePosts(userId: Int!): [Post]
    savedPosts(userId: Int!): Post
    taggedPosts(userId: Int!): Post
    likedPosts(userId: Int!): Post
    editProfile(
      userId: Int!
      name: String!
      description: String
      profilePhoto: String
    ): User!
    createStory(file: String!): Story!
    deleteStory(storyId: Int!): Story!
    likeStory(storyId: Int!): Story_likes
    unlikeStory(storyId: Int!): Story_likes
    saveStory(storyId: Int!): Story
    unsaveStory(storyId: Int!): Story
    profileStories(userId: Int!): [Story]
    profileFollowers(userId: Int!): [User]
    profileFollowings(userId: Int!): [User]
    suggestFollow(userId: Int!): [User]
    profileSuggest(userId: Int!): String
    followingsStory(userId: Int!): [Story]
    sendResetEmail(email: String!): String
    resetPassword(token: String!, newPassword: String!): String
  }
`;
