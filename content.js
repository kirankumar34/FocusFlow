(function () {
    /**
     * FocusTube Smart-Reveal Engine (v6)
     * 
     * LOGIC: 
     * 1. Hard Negatives (Prank, Vlog, Movie) -> ALWAYS BLUR.
     * 2. Hard Positives (Python, Cyber Security, Finance) -> ALWAYS UNBLUR.
     * 3. Soft Negatives (Tamil, Audio, Video) -> BLUR ONLY IF NO POSITIVE FOUND.
     */

    let isProductiveMode = false;
    let safetySweep = null;

    // --- KEYWORD MATRICES ---

    const HARD_NEGATIVES = [
        'prank', 'vlog', 'comedy', 'funny', 'roast', 'reaction', 'trailer', 'teaser',
        'movie', 'cinema', 'highlights', 'gameplay', 'gaming', 'dance', 'performance',
        't-series', 'official video', 'deleted scenes', 'kollywood', 'bollywood', 'vijay', 'ajith'
    ];

    const SOFT_NEGATIVES = [
        'audio', 'video song', 'lyrics', 'remix', 'jukebox', 'bgm', 'short'
    ];

    const POSITIVE_KEYWORDS = [
        // Tech & Programming
        'tutorial', 'course', 'coding', 'programming', 'python', 'java', 'javascript',
        'react', 'node', 'ai', 'machine learning', 'data science', 'engineering',
        'cyber security', 'cybersecurity', 'data analyst', 'roadmap', 'web development',
        'algorithms', 'software', 'development', 'backend', 'frontend', 'devops', 'cloud',
        'docker', 'kubernetes', 'linux', 'automation', 'explained', 'crash course',
        'website', 'publish', 'online', 'free', 'test', 'bdd', 'scenarios', 'deploy',
        'architecture', 'revit', 'autocad', 'design', 'ux', 'ui', 'tool', 'tech',
        'brotype', 'cyber voyage', 'katalon', 'thiru', 'ponmozhigal',
        // Finance, Business & Productivity
        'finance', 'investing', 'stock market', 'trading', 'rich dad poor dad', 'business',
        'startup', 'marketing', 'economics', 'productivity', 'study', 'career', 'interview',
        'informative', 'history', 'documentary', 'facts', 'how to', 'guide', 'lesson',
        'science', 'physics', 'math', 'chemistry', 'biology', 'education'
    ];

    const style = document.createElement('style');
    style.id = 'focustube-v6-styles';
    style.innerHTML = `
        yt-thumbnail-view-model img, ytd-thumbnail img, yt-image img, .yt-core-image {
            transition: filter 0.3s ease !important;
        }
        html[focustube-active="true"] yt-thumbnail-view-model img,
        html[focustube-active="true"] ytd-thumbnail img,
        html[focustube-active="true"] yt-image img {
            filter: blur(28px) opacity(0.15) grayscale(1) !important;
            pointer-events: none !important;
        }
        html[focustube-active="true"] .focustube-productive yt-thumbnail-view-model img,
        html[focustube-active="true"] .focustube-productive ytd-thumbnail img,
        html[focustube-active="true"] .focustube-productive yt-image img {
            filter: blur(0px) opacity(1) grayscale(0) !important;
            pointer-events: auto !important;
        }
    `;
    document.documentElement.appendChild(style);

    function evaluateProductivity(text) {
        if (!text) return false;
        const lower = text.toLowerCase();

        // 1. Positives are HIGH PRIORITY - if it's tech, it's productive
        const hasPositive = POSITIVE_KEYWORDS.some(kw => lower.includes(kw));

        // 2. Hard Negatives (Pranks, Movies) override unless it's a very strong positive
        if (HARD_NEGATIVES.some(kw => lower.includes(kw))) {
            // Even if it has a negative word, if it has 2+ positive words, maybe it's educational (e.g. "React movie app tutorial")
            const positiveCount = POSITIVE_KEYWORDS.filter(kw => lower.includes(kw)).length;
            return positiveCount >= 2;
        }

        if (hasPositive) return true;

        // 3. Soft Negatives (like 'Audio') blur if no positive was found
        const hasSoftNegative = SOFT_NEGATIVES.some(kw => lower.includes(kw));
        if (hasSoftNegative) return false;

        // Default: stay blurred for safety
        return false;
    }

    function process(el) {
        const titleEl = el.querySelector('#video-title, #video-title-link, .yt-lockup-metadata-view-model__title, #video-title.ytd-rich-grid-media');
        const metaEl = el.querySelector('#metadata-line, .yt-content-metadata-view-model__metadata-row');

        if (titleEl) {
            const combined = (titleEl.textContent + " " + (metaEl ? metaEl.textContent : "")).trim();
            if (evaluateProductivity(combined)) {
                el.classList.add('focustube-productive');
            } else {
                el.classList.remove('focustube-productive');
            }
            el.setAttribute('data-focustube-v6', 'true');
        }
    }

    const TARGETS = 'yt-lockup-view-model, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-thumbnail-view-model';

    function scan() {
        if (!isProductiveMode) return;
        document.querySelectorAll(`${TARGETS}:not([data-focustube-v6])`).forEach(process);
    }

    function toggle(enabled) {
        isProductiveMode = enabled;
        document.documentElement.setAttribute('focustube-active', enabled);
        if (enabled) {
            scan();
            if (!safetySweep) safetySweep = setInterval(scan, 700);
        } else {
            if (safetySweep) clearInterval(safetySweep);
            safetySweep = null;
            document.querySelectorAll('[data-focustube-v6]').forEach(el => {
                el.classList.remove('focustube-productive');
                el.removeAttribute('data-focustube-v6');
            });
        }
    }

    chrome.storage.sync.get(['productiveMode'], (res) => toggle(res.productiveMode ?? false));
    chrome.storage.onChanged.addListener((c) => { if (c.productiveMode) toggle(c.productiveMode.newValue); });
    new MutationObserver(() => { if (isProductiveMode) scan(); }).observe(document, { childList: true, subtree: true });
    window.addEventListener('yt-navigate-finish', () => { if (isProductiveMode) scan(); });

})();
