import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../utils/axiosInstance';

const AutoGen = ({ inputText, onTextEnhanced, textFieldName = "description" }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const enhanceWithAI = async () => {
        console.log("Input text received for enhancement:", inputText); // Debug

        if (!inputText || !inputText.trim()) {
            toast.warning("Please add some text to enhance.");
            return;
        }

        setIsProcessing(true);
        try {
            const improvedText = await generateImprovedText(inputText);
            onTextEnhanced(improvedText, textFieldName);
            toast.success("Text enhanced successfully!");
        } catch (error) {
            console.error("AI enhancement error:", error);
            toast.error("Failed to enhance text. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const generateImprovedText = async (text) => {
        try {
            const prompt = `You are helping rewrite support ticket descriptions.

Please improve the following input by rewriting it in a clear, professional tone while keeping it in the **first-person perspective** (as if the user is reporting their own issue):

---
"${text}"
---

Your output should:
- Be concise (ideally 3–4 lines)
- Use first-person language like "I'm facing...", "My Wi-Fi...", etc.
- Be professional, clear, and aligned with the original meaning
- Avoid adding unrelated or imaginary details
- Keep everything understandable and realistic

Return only the improved text.`;

            const { data } = await axiosInstance.post(
                'services/ai/generate/',
                { prompt },
                { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
            );
            return data.text;
        } catch (error) {
            console.error("Error generating improved text:", error);
            throw new Error("Failed to generate improved text");
        }
    };

    return (
        <button
            type="button"
            onClick={enhanceWithAI}
            disabled={isProcessing}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
            title="Enhance text with AI"
        >
            <Sparkles size={16} />
            {isProcessing ? "Enhancing..." : "Enhance with AI"}
        </button>
    );
};

export default AutoGen;
