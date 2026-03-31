const API_KEY = 'AIzaSyB_6HJmZiuRqzjYTQHrKGYhZdfzZxx0Zkg';

const cvText = document.getElementById('cvText');
const targetRole = document.getElementById('targetRole');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const scoreCircle = document.getElementById('scoreCircle');
const scoreNumber = document.getElementById('scoreNumber');
const scoreLabel = document.getElementById('scoreLabel');
const feedback = document.getElementById('feedback');

async function analyzeCV() {
    const cv = cvText.value.trim();
    if (!cv) return;

    const role = targetRole.value.trim();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    resultSection.style.display = 'none';
    loading.style.display = 'flex';

    const prompt = `You are a professional CV reviewer and career coach. Analyze the following CV and provide:

1. A score out of 100
2. A short label (like "Strong CV", "Needs Work", "Good Foundation", "Excellent")
3. Strengths (bullet points)
4. Weaknesses (bullet points)  
5. Specific suggestions to improve (bullet points)
6. Missing sections or information
${role ? `7. How well this CV fits for the role: ${role}` : ''}

CV Content:
${cv}

Respond in this exact format:
SCORE: [number]
LABEL: [short label]

### Strengths
- [point]

### Weaknesses
- [point]

### Suggestions
- [point]

### Missing Information
- [point]
${role ? '\n### Role Fit\n- [point]' : ''}`;

    const models = [
        'gemini-2.5-flash',
        'gemini-2.0-flash-001',
        'gemini-1.5-flash-001',
        'gemini-1.0-pro'
    ];

    let data = null;
    let lastError = '';

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const result = await res.json();

            if (!result.error && result.candidates && result.candidates[0]) {
                data = result;
                break;
            } else {
                lastError = result.error ? result.error.message : 'No response';
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    if (!data) {
        feedback.innerHTML = '<p>Could not connect to AI. Error: ' + lastError + '</p>';
        resultSection.style.display = 'block';
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze CV';
        return;
    }

    try {
        const text = data.candidates[0].content.parts[0].text;

        const scoreMatch = text.match(/SCORE:\s*(\d+)/);
        const labelMatch = text.match(/LABEL:\s*(.+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        const label = labelMatch ? labelMatch[1].trim() : 'Reviewed';

        let scoreClass = 'bad';
        if (score >= 80) scoreClass = 'great';
        else if (score >= 65) scoreClass = 'good';
        else if (score >= 45) scoreClass = 'ok';

        scoreCircle.className = 'score-circle ' + scoreClass;
        scoreNumber.textContent = score;
        scoreLabel.textContent = label;

        let feedbackHtml = text
            .replace(/SCORE:.*\n?/, '')
            .replace(/LABEL:.*\n?/, '')
            .replace(/### (.+)/g, '<h3>$1</h3>')
            .replace(/^- (.+)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .trim();

        feedback.innerHTML = feedbackHtml;
        resultSection.style.display = 'block';
    } catch (err) {
        feedback.innerHTML = '<p>Error parsing response: ' + err.message + '</p>';
        resultSection.style.display = 'block';
    }

    loading.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze CV';
}

analyzeBtn.addEventListener('click', analyzeCV);