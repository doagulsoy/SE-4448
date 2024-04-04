import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "apollo-server";
import passwordValidator from "password-validator";
import SibApiV3Sdk from "sib-api-v3-sdk";
import crypto from "crypto";

const generateRandomToken = (length) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const token = Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => characters[byte % characters.length])
    .join("");
  return token;
};

// Create a schema
var schema = new passwordValidator();
schema
  .is()
  .min(8)
  .is()
  .max(20)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols()
  .has()
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(["Passw0rd", "Password123"]);

const apiKey = SibApiV3Sdk.ApiClient.instance.authentications["api-key"];
apiKey.apiKey = process.env.API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

const generateResetToken = (userId) => {
  const shortToken = crypto.randomBytes(3).toString("hex");
  return jwt.sign({ userId, shortToken }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const authResolver = {
  Query: {
    authentication: async (_, __, { prisma, user }) => {
      if (!user) {
        throw new AuthenticationError("User not found!");
      }
      return prisma.user.findUnique({ where: { id: user.id } });
    },
  },
  Mutation: {
    login: async (_, { identifier, password }, { prisma }) => {
      try {
        const isEmail = /\S+@\S+\.\S+/.test(identifier);
        let user;
        if (isEmail) {
          user = await prisma.user.findUnique({
            where: {
              email: identifier,
            },
          });
        } else if (!isEmail) {
          user = await prisma.user.findUnique({
            where: {
              username: identifier,
            },
          });
        } else {
          throw new AuthenticationError("Invalid credentials!");
        }
        if (!user) {
          throw new AuthenticationError("Incorrect email!");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(user.password);
        if (!isMatch) {
          throw new AuthenticationError("Incorrect password!");
        }
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET
        );
        console.log(user);
        console.log(token);
        return { token, user };
      } catch (error) {
        console.log(error.message);
        throw new AuthenticationError("User not found!");
      }
    },

    register: async (_, { name, username, email, password }, { prisma }) => {
      try {
        const existingUser = await prisma.user.findUnique({
          where: {
            email,
            username,
          },
        });

        if (existingUser) {
          throw new AuthenticationError("User already exists!");
        }
        if (username.length < 4 || username.length > 20) {
          throw new AuthenticationError(
            "Username must be between 4 and 20 characters"
          );
        }
        //Big Letter/ small letter / special characters / number
        if (!schema.validate(password)) {
          console.log("Invalid  Password!");
          throw new AuthenticationError(
            "Password must be between 8 and 20 characters",
            "Includes at least 1 upper letter and lower letter",
            "Includes at least 1 speacial characters! "
          );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const registerUser = await prisma.user.create({
          data: {
            name,
            username,
            email,
            password: hashedPassword,
          },
        });
        const user = await prisma.user.findFirst({
          where: {
            id: registerUser.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            profile_photo: true,
          },
        });
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET
        );
        console.log("token", token);
        console.log("user", user);
        return { token, user };
      } catch (error) {
        console.log(error.message);
        return null;
      }
    },
    sendResetEmail: async (_, { email }, { prisma }) => {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        throw new AuthenticationError("User not found");
      }

      const shortToken = generateRandomToken(5);
      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          reset_token: shortToken,
        },
      });
      sendSmtpEmail.htmlContent = `Click the following link to reset your password: <a href="http://localhost:5173/auth/reset/${shortToken}">Reset Password</a>`;
      sendSmtpEmail.subject = "Password Reset";
      sendSmtpEmail.to = [{ email, name: user.name }];
      sendSmtpEmail.sender = {
        name: "Berk Ai",
        email: "graphtestql@univerlist.com",
      };

      try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(
          "SendinBlue API called successfully. Returned data: " +
            JSON.stringify(data)
        );
        return shortToken;
      } catch (error) {
        console.log(error);
        throw new Error("Failed to send reset email");
      }
    },

    resetPassword: async (_, { token, newPassword }, { prisma }) => {
      try {
        const resetUser = await prisma.user.findFirst({
          where: {
            reset_token: token,
          },
        });

        if (!resetUser) {
          throw new AuthenticationError("User not found");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
          where: { id: resetUser.id },
          data: { password: hashedPassword },
        });

        return "Password reset successful";
      } catch (error) {
        console.log(error.message);
        throw new AuthenticationError("Failed to reset password");
      }
    },
  },
};
