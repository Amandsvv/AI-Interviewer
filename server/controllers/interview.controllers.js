import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" });
        }
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);


        const standardFonts = pathToFileURL(
            path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/")
        ).href;
        const filepath = req.file.path

        const fileBuffer = await fs.promises.readFile(filepath)
        const uint8Array = new Uint8Array(fileBuffer)

        const pdf = await pdfjsLib.getDocument({
            data: uint8Array,
            standardFontDataUrl: standardFonts,
            useSystemFonts: true
        }).promise;
        let resumeText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            const pageText = content.items.map(item => item.str).join(" ");
            resumeText += pageText + "\n";
        }

        resumeText = resumeText.replace(/\s+/g, " ").trim()

        const messages = [
            {
                role: "system",
                content: `Extract structured data from resume.
                        return strictly JSON:

                        {
                            "role" : "string",
                            "experience":"string",
                            "projects":["project1", "project2"],
                            "skills" : ["skill1", "skill2"]
                        }
                    `
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        const aiResponse = await askAi(messages)
        const clean = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const parsed = JSON.parse(clean);

        fs.unlinkSync(filepath);

        res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        })
    } catch (error) {
        console.error("Error while analyzing resume : ", error)
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
        return res.status(500).json({ message: error.message });
    }
}

export const generatequestions = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(404).json({ message: "User not found" })
        }
        role = role?.trim();
        experience = experience?.trim();
        mode?.trim();

        if (!role || !experience || !mode) {
            return res.status(404).json({ message: "Role, Experience and Mode are required" })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (user.credits < 50) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 50 required."
            })
        }

        const projectText = Array.isArray(projects) && projects.length ? projects.join(", ") : "None";
        const skillsText = Array.isArray(skills) && skills.length ? skills.join(", ") : "None";
        const safeResume = resumeText?.trim() || "None";

        const userPrompt = `
            Role : ${role}
            Experience : ${experience}
            InterviewMode : ${mode}
            Projects: ${projectText}
            Skills:${skillsText},
            Resume: ${safeResume}                    
        `
        const messages = [
            {
                role: "system",
                content: `
                    You are a real human interviewer conducting a professional interview.
                    speak in simple natural English as if you are drictly talking to the candidate.
                    Generate exactly 5 interview questions.

                    Strict Rules :
                    - Each question must contain beween 15 to 25 words,
                    - Each question must be a single complete sentence.
                    - Do not number them.
                    - Don not add explanations.
                    - One question per line only.
                    - Keep language simple and conversational.
                    - Questions must feel practical and realistic.

                    Difficulty progression:
                    Question 1 → easy  
                    Question 2 → easy  
                    Question 3 → medium  
                    Question 4 → medium  
                    Question 5 → hard  

                    Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details..
                `
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        const aiResponse = await askAi(messages);

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({ message: "AI returned empty response." })
        }

        const questionArray = aiResponse.split("\n")
            .map(q => q.trim()).filter(q => q.length > 0).slice(0, 5);

        if (questionArray.length === 0) {
            return res.status(500).json({
                message: "AI failed to generate questions."
            })
        }

        user.credits -= 50;
        await user.save();

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: questionArray.map((q, i) => ({
                question: q,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][i],
                timeLimit: [60, 60, 90, 90, 120][i]
            }))

        });

        if (!interview) {
            return res.status(500).json({ message: "Interview creation failed" })
        }
        return res.json({
            interviewId: interview._id,
            creditLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        })

    } catch (error) {
        console.error("Error found while generating questions : ", error);
        return res.status(500).json({ message: `Failed to Generate Questions  : ${error}` });
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const {interviewId, questionIndex, answer, timeTaken} = req.body;

        const interview = await Interview.findById(interviewId);
        const question = interview.questions[questionIndex]

        //If no answer

        if (!answer) {
            question.score = 0;
            question.feedback = "You did not submit an answer";
            question.answer = "";

            await interview.save();

            return res.json({ feedback: question.feedback })
        }

        //If time exceeded
        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;

            await interview.save();

            return res.json({ feedback: question.feedback })
        }


        const messages = [
            {
                role: "system",
                content: `
                    You are a professional human interviewer evaluating a candidate's answer in a real interview.

                    Evaluate naturally and fairly, like a real person would.

                    Score the answer in these areas (0 to 10):

                    1. Confidence – Does the answer sound clear, confident, and well-presented?
                    2. Communication – Is the language simple, clear, and easy to understand?
                    3. Correctness – Is the answer accurate, relevant, and complete?

                    Rules:
                    - Be realistic and unbiased.
                    - Do not give random high scores.
                    - If the answer is weak, score low.
                    - If the answer is strong and detailed, score high.
                    - Consider clarity, structure, and relevance.

                    Calculate:
                    finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

                    Feedback Rules:
                    - Write natural human feedback.
                    - 10 to 15 words only.
                    - Sound like real interview feedback.
                    - Can suggest improvement if needed.
                    - Do NOT repeat the question.
                    - Do NOT explain scoring.
                    - Keep tone professional and honest.

                    Return ONLY valid JSON in this format:

                    {
                    "confidence": number,
                    "communication": number,
                    "correctness": number,
                    "finalScore": number,
                    "feedback": "short human feedback"
                    }
                `
            },
            {
                role: "user",
                content: `
                    Question: ${question.question}
                    Answer: ${answer}
                `
            }
        ];

        const aiResponse = await askAi(messages);

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({ message: "AI failed to evaluate & give required response" })
        }
        const parsed = JSON.parse(aiResponse);

        question.answer = answer;
        question.confidence = parsed.confidence;
        question.communication = parsed.communication;
        question.correctness = parsed.correctness;
        question.score = parsed.finalScore;
        question.feedback = parsed.feedback;

        await interview.save();

        return res.status(200).json({ feedback: parsed.feedback })
    } catch (error) {
        console.log("Error while sumission of answer : ", error);
        return res.status(500).json({ message: `Failed to submit answer  : ${error}` });
    }
}

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body;
        if (!interviewId) {
            return res.status(404).json({ message: "Interview ID not found" });
        }
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Failed to find Interview" })
        }

        let totalScore = 0;
        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;
        const totalQuestions = interview.questions.length;

        interview.questions.forEach((q) => {
            totalScore += q.score || 0;
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
        });

        const finalScore = totalQuestions ? totalScore / totalQuestions : 0;

        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;

        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

        interview.finalScore = finalScore;
        interview.status = "completed";

        await interview.save();

        return res.status(200).json({
            finalScore: Number(finalScore.toFixed(1)),
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions.map((q) => ({
                question: q.question,
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
            })),
        })
    } catch (error) {
        console.error("Final interview error : ", error)
        return res.status(500).json({ message: `Failed to submit answer  : ${error}` });

    }
}