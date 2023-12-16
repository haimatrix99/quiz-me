import { currentUser } from "@clerk/nextjs";
import * as z from "zod";

import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { utapi } from "@/lib/utapi";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const user = await currentUser();

    if (!user || !user.id || !user.emailAddresses[0])
      throw new TRPCError({ code: "UNAUTHORIZED" });

    // check if the user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
        },
      });
    }

    return { success: true };
  }),

  getVideo: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const video = await db.video.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      return video;
    }),

  deleteVideo: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const video = await db.video.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const deleteQuiz = db.quiz.deleteMany({
        where: {
          videoId: input.id,
        },
      });

      const deleteVideo = db.video.delete({
        where: {
          id: input.id,
        },
      });

      await db.$transaction([deleteQuiz, deleteVideo]);

      await utapi.deleteFiles([video.thumbnailKey!, video.key]);

      return video;
    }),

  getVideos: privateProcedure.query(async () => {
    const user = await currentUser();

    if (!user || !user.id || !user.emailAddresses[0])
      throw new TRPCError({ code: "UNAUTHORIZED" });

    const videos = await db.video.findMany({
      where: {
        userId: user.id,
      },
    });

    if (!videos) throw new TRPCError({ code: "NOT_FOUND" });

    return videos;
  }),

  getQuiz: privateProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;

    // Retrieve the user with the given ID
    const quiz = await db.quiz.findMany({
      where: {
        videoId: input,
      },
    });
    if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

    return quiz;
  }),

  updateQuiz: privateProcedure
    .input(
      z.object({
        id: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const quiz = await db.quiz.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

      await db.quiz.update({
        data: {
          quizStatus: "ANSWERED",
          selectedAnswer: input.answer,
        },
        where: {
          id: input.id,
        },
      });

      return quiz;
    }),
});

export type AppRouter = typeof appRouter;
