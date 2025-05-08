import { useState } from "react";
import axios from "axios";
import slangdata from "../data/slangdata";
import "./SlangTranslator.css";

// ✅ Load from .env
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export default function SlangTranslator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [slangUsed, setSlangUsed] = useState([]);

  const translate = async () => {
    const lowerInput = input.toLowerCase();
    const foundSlang = slangdata.filter(entry => {
      const terms = [
        entry.slang_term.toLowerCase().trim(),
        ...(entry.aliases ? entry.aliases.toLowerCase().split(",").map(a => a.trim()) : [])
      ];
    
      return terms.some(term => {
        const pattern = new RegExp(`\\b${term}\\b`, 'i');
        return pattern.test(lowerInput);
      });
    });
    
    setSlangUsed(foundSlang);

    const userPrompt = `
Sentence: "${input}"
Known slang terms: ${foundSlang.map(e => e.slang_term).join(", ")}
Translate to standard English while keeping tone. Provide a breakdown.
`;

    try {
      const res = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a slang translator that keeps tone but clarifies meaning." },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      setResult(res.data.choices[0].message.content);
    } catch (err) {
      console.error(err);
      setResult("❌ Error: Check your API key or request.");
    }
  };

  return (
    <div className="translator-container">
      <h1>🗣 Slang Translator</h1>
      <p>Type in slang. Get clean English + slang breakdown.</p>

      <textarea
        className="input-box"
        rows="4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., That outfit is straight fire. She slayed."
      />

      <button className="translate-btn" onClick={translate}>
        Translate 🔍
      </button>

      {result && (
        <div className="output-card">
          <h2>🧼 Clean Translation</h2>
          <div className="result-text">{result}</div>

          {slangUsed.length > 0 && (
            <>
              <h3>📖 Slang Breakdown</h3>
              <ul className="slang-list">
                {slangUsed.map((entry, i) => (
                  <li key={i}>
                    <strong>{entry.slang_term}:</strong> {entry.meaning}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
