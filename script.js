let GROQ_KEY = localStorage.getItem('groq_key') || '';

const cvText = document.getElementById('cvText');
const targetRole = document.getElementById('targetRole');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const scoreCircle = document.getElementById('scoreCircle');
const scoreNumber = document.getElementById('scoreNumber');
const scoreLabel = document.getElementById('scoreLabel');
const feedback = document.getElementById('feedback');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatus = document.getElementById('keyStatus');

if (GROQ_KEY) {
    apiKeyInput.value = '••••••••••';
    keyStatus.textContent = 'Key saved';
    keyStatus.style.color = '#27ae60';
}

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key && !key.includes('•')) {
        GROQ_KEY = key;
        localStorage.setItem('groq_key', key);
        apiKeyInput.value = '••••••••••';
        keyStatus.textContent = 'Key saved';
        keyStatus.style.color = '#27ae60';
    }
});

async function analyzeCV() {
    const cv = cvText.value.trim();
    if (!cv) return;
    if (!GROQ_KEY) {
        feedback.innerHTML = '<p>Please enter your Groq API key first.</p>';
        resultSection.style.display = 'block';
        return;
    }

    const role = targetRole.value.trim();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    resultSection.style.display = 'none';
    loading.style.display = 'flex';

    const prompt = `You are a professional CV reviewer. Analyze this CV:

${cv}

${role ? `Target role: ${role}` : ''}

Respond EXACTLY:

SCORE: [0-100]
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

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 })
        });
        const data = await res.json();
        if (data.error) { feedback.innerHTML = '<p>Error: ' + data.error.message + '</p>'; resultSection.style.display = 'block'; loading.style.display = 'none'; analyzeBtn.disabled = false; analyzeBtn.textContent = 'Analyze CV'; return; }

        const text = data.choices[0].message.content;
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

        let feedbackHtml = text.replace(/SCORE:.*\n?/, '').replace(/LABEL:.*\n?/, '')
            .replace(/### (.+)/g, '<h3>$1</h3>')
            .replace(/^- (.+)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').trim();

        feedback.innerHTML = feedbackHtml;
        resultSection.style.display = 'block';
    } catch (err) {
        feedback.innerHTML = '<p>Error: ' + err.message + '</p>';
        resultSection.style.display = 'block';
    }

    loading.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze CV';
}

analyzeBtn.addEventListener('click', analyzeCV);