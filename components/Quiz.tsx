"use client";

import { trpc } from "@/app/_trpc/client";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

const Quiz = ({ videoId }: { videoId: string }) => {
  const utils = trpc.useContext();
  const quiz = trpc.getQuiz.useQuery(videoId);

  if (!quiz) {
    return <div>Loading...</div>;
  }

  const { mutate: updateQuiz } = trpc.updateQuiz.useMutation({
    onSuccess: () => {
      utils.getQuiz.invalidate();
    },
  });

  return (
    <div>
      {quiz.data &&
        quiz.data.map((q) => (
          <div key={q.id}>
            <RadioGroup defaultValue={q.selectedAnswer!} className="mb-6">
              <div className="font-semibold">{q.question}</div>
              <div
                className="flex items-center space-x-2"
                onClick={() => updateQuiz({ id: q.id, answer: q.answerA })}
              >
                <RadioGroupItem value={q.answerA} id={`${q.id}-a`} />
                <Label
                  htmlFor={`${q.id}-a`}
                  className={
                    q.answerA !== q.selectedAnswer
                      ? ""
                      : q.correctAnswer === q.selectedAnswer
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {q.answerA}
                </Label>
              </div>
              <div
                className="flex items-center space-x-2"
                onClick={() => updateQuiz({ id: q.id, answer: q.answerB })}
              >
                <RadioGroupItem value={q.answerB} id={`${q.id}-b`} />
                <Label
                  htmlFor={`${q.id}-b`}
                  className={
                    q.answerB !== q.selectedAnswer
                      ? ""
                      : q.correctAnswer === q.selectedAnswer
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {q.answerB}
                </Label>
              </div>
              <div
                className="flex items-center space-x-2"
                onClick={() => updateQuiz({ id: q.id, answer: q.answerC })}
              >
                <RadioGroupItem value={q.answerC} id={`${q.id}-c`} />
                <Label
                  htmlFor={`${q.id}-c`}
                  className={
                    q.answerC !== q.selectedAnswer
                      ? ""
                      : q.correctAnswer === q.selectedAnswer
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {q.answerC}
                </Label>
              </div>
              <div
                className="flex items-center space-x-2"
                onClick={() => updateQuiz({ id: q.id, answer: q.answerD })}
              >
                <RadioGroupItem value={q.answerD} id={`${q.id}-d`} />
                <Label
                  htmlFor={`${q.id}-d`}
                  className={
                    q.answerD !== q.selectedAnswer
                      ? ""
                      : q.correctAnswer === q.selectedAnswer
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {q.answerD}
                </Label>
              </div>
            </RadioGroup>
          </div>
        ))}
    </div>
  );
};

export default Quiz;
