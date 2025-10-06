import { GoogleGenAI } from "@google/genai";

const buildLinkedInPrompt = (profileText: string): string => {
  return `
    You are an expert career coach and professional branding strategist. Your task is to analyze the provided LinkedIn profile text and generate a compelling, professional summary.

    The user has pasted their raw LinkedIn profile text below:
    ---
    ${profileText}
    ---

    Based on this text, generate a comprehensive analysis. Structure your response with the following sections using Markdown formatting:

    ### Professional Summary
    A brief, impactful one-paragraph summary. Start with a strong title (e.g., "Seasoned Software Engineer with 10+ years of experience..."). Highlight key achievements, core competencies, and career focus. This should be suitable for the top of a resume or a LinkedIn "About" section.

    ### Key Technical Skills
    A bulleted list of the most prominent technical skills mentioned. Categorize them logically (e.g., Programming Languages, Frameworks/Libraries, Cloud/DevOps, Databases, Tools).

    ### Core Competencies (Soft Skills)
    A bulleted list of soft skills demonstrated through project descriptions, summaries, or experience. Examples include "Team Leadership", "Agile Methodologies", "Project Management", "Client Communication", etc.

    ### Experience Highlights
    Provide a detailed, bulleted list for the most significant job roles. For each role, summarize:
    - The key responsibilities and achievements.
    - The specific skills and technologies used and demonstrated in that role. Rephrase the user's text into concise, action-oriented bullet points.
    Example:
    * **Senior Software Engineer at TechCorp (Jan 2020 - Present)**:
        - Led the development of a new microservices-based e-commerce platform, resulting in a 30% increase in performance.
        - Mentored junior developers, fostering a culture of code quality and best practices through regular code reviews and pair programming sessions.
        - Technologies used: Go, Kubernetes, AWS (S3, Lambda), gRPC.

    ### Potential Job Roles
    Based on the skills and experience, suggest 3-5 specific job titles this person is well-suited for (e.g., "Senior Backend Engineer (Go)", "Cloud Solutions Architect", "DevOps Lead"). Provide a brief justification for each.

    ### Profile Optimization Suggestions
    Provide 2-3 actionable tips for improving their LinkedIn profile based on the provided text. Frame this as constructive advice. For example: "Quantify achievements in your experience section with metrics (e.g., 'increased performance by X%') to better showcase impact." or "Consider adding a 'Projects' section to highlight specific work samples."

    Be positive, professional, and use strong action verbs. Do not invent information not present in the provided text.
  `;
};

const buildResumePrompt = (analysisText: string, personalInfo: { name: string; email: string; phone: string; website: string }): string => {
  return `
    You are an expert resume writer and formatter. You will be given a structured career analysis in Markdown format and personal contact details. Your task is to transform this information into a professional, single-column resume, also in Markdown format.

    Here is the career analysis:
    ---
    ${analysisText}
    ---

    Here is the user's personal information:
    - Name: ${personalInfo.name || 'Your Name'}
    - Email: ${personalInfo.email || 'your.email@example.com'}
    - Phone: ${personalInfo.phone || '(555) 123-4567'}
    - Website/Portfolio: ${personalInfo.website || 'yourportfolio.com'}

    Follow these instructions precisely:
    1.  **Header:** Start with the user's name as a main heading (\`# Name\`). Below it, list the contact details (Phone, Email, Website) on a single line, separated by pipe characters (|).
    2.  **Summary:** Create a section titled \`## Professional Summary\`. Use the content from the "Professional Summary" section of the analysis.
    3.  **Skills:** Create a section titled \`## Skills\`. Combine the "Key Technical Skills" and "Core Competencies" from the analysis. Present them as a clean, categorized, bulleted list.
    4.  **Experience:** Create a section titled \`## Work Experience\`. Use the content from the "Experience Highlights" section. For each job, format it as:
        - **Job Title** | Company Name
        - *Month Year – Month Year* (or *Month Year - Present*)
        - Then, list the achievements as bullet points (\`* \`).
    5.  **Omissions:** Do NOT include the "Potential Job Roles" or "Profile Optimization Suggestions" sections from the original analysis.
    6.  **Formatting:** Use clean and standard Markdown. Do not add any extra commentary, introductory text, or placeholder city/state information unless it was present in the original text. The output should be ready to be rendered directly as a resume.
  `;
}

const callGemini = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Could not get a response from the AI model.");
    }
}

export const summarizeLinkedInProfile = async (profileText: string): Promise<string> => {
  const prompt = buildLinkedInPrompt(profileText);
  return callGemini(prompt);
};

export const createResumeFromAnalysis = async (
    analysisText: string,
    personalInfo: { name: string; email: string; phone: string; website: string }
): Promise<string> => {
    const prompt = buildResumePrompt(analysisText, personalInfo);
    return callGemini(prompt);
}