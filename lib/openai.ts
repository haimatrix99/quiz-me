import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate } from "langchain/prompts";

const template = `You are a helpful assistant who generates questions with multiple choices with one correct answer. 
A user will pass in a paragraph, and you should generate 5 questions with multiple choices with one correct answer and the correct answer of the question. The answers is following with format ["A.<Answer A>", "B.<Answer B>", "C.<Answer C>", "D.<Answer D>"]. The correct answer is following with one items in list of the answers. The output will be have JSON string with the key of question is question, the key of the answers is answers, the key of correct answer is correct_answer.
ONLY return JSON string, and nothing more.`;

const humanTemplate = "{transcript}";

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", template],
  ["human", humanTemplate],
]);

const model = new ChatOpenAI({});

export const chain = chatPrompt.pipe(model);
