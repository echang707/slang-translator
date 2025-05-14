import { useState } from "react";
import axios from "axios";
import slangdata from "../data/slangdata";
import "./SlangTranslator.css";
import Fuse from "fuse.js";

// ✅ Load from .env
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export default function SlangTranslator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [slangUsed, setSlangUsed] = useState([]);

  const translate = async () => {
    const cleanedData = slangdata.map(item => ({
      ...item,
      all_aliases: [item.slang_term, ...(item.aliases ? item.aliases.split(",").map(a => a.trim()) : [])]
    }));
    
    const fuse = new Fuse(cleanedData, {
      includeScore: true,
      threshold: 0.4,
      keys: ["all_aliases"]
    });

    const results = fuse.search(input.toLowerCase());
    const foundSlang = results.map(r => r.item);
    setSlangUsed(foundSlang);

    const userPrompt = `
    You are a slang translator. Use only the slang terms and definitions provided below to interpret the sentence.

    Sentence: "${input}"

    Slang Terms Found:
    ${foundSlang.map(e => `- ${e.slang_term}: ${e.translation || e.meaning}`).join("\n")}

    Now translate the sentence into plain English (preserving tone), and then explain each slang term.

    Format like:
    Translation: "..."
    Breakdown:
    - "term": explanation
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
