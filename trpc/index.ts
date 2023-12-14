import * as z from "zod";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { currentUser } from "@clerk/nextjs";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { utapi } from "@/lib/utapi";
import { deepgram } from "@/lib/deepgram";

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

      await utapi.deleteFiles([video.thumbnailKey, video.key]);

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

    return videos;
  }),
});

export type AppRouter = typeof appRouter;
