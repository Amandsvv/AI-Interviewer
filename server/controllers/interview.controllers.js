import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { askAi } from "../services/openRouter.service.js";

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