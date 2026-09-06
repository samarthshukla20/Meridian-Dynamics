document.addEventListener('DOMContentLoaded', () => {

  // Helper function to safely send gtag events
  function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  // =========================================================
  // MERIDIAN ATLAS
  // =========================================================

  const container = document.createElement('div');

  container.innerHTML = `

    <!-- Floating Atlas Button -->
    <button id="md-chat-toggle" aria-label="Open Meridian Atlas">
      <span class="md-atlas-star">✦</span>
    </button>

    <!-- Chat Window -->
    <div id="md-chat-window">

      <!-- Header -->
      <div class="md-chat-header">

        <div class="md-atlas-identity">

          <div class="md-atlas-icon">
            ✦
          </div>

          <div class="md-atlas-title">
            <h4>Meridian Atlas</h4>

            <span>
              <i class="md-status-dot"></i>
              Your AI Growth Assistant
            </span>
          </div>

        </div>

        <button
          id="md-chat-close"
          aria-label="Close Meridian Atlas"
        >
          &times;
        </button>

      </div>

      <!-- Messages -->
      <div id="md-chat-history" class="md-chat-messages">

        <!-- Welcome Screen -->
        <div class="md-welcome">

          <h3>
            How can I help your business?
          </h3>

          <p>
            I'm Atlas, Meridian Dynamics' AI growth assistant.
            Ask me about websites, SEO, social growth, or your
            digital presence.
          </p>

          <div class="md-suggestions-label">
            Try asking
          </div>

          <div class="md-suggestions">

            <button
              class="md-suggestion"
              data-prompt="What website plan would be best for my business?"
            >
              <span>🌐</span>
              <span>I need a website</span>
            </button>

            <button
              class="md-suggestion"
              data-prompt="How can Meridian Dynamics help me grow my business?"
            >
              <span>📈</span>
              <span>Grow my business</span>
            </button>

            <button
              class="md-suggestion"
              data-prompt="How can I improve my Google Business Profile and local SEO?"
            >
              <span>📍</span>
              <span>Improve my Google presence</span>
            </button>

            <button
              class="md-suggestion"
              data-prompt="Which Social Growth plan is right for my business?"
            >
              <span>📱</span>
              <span>Grow my Instagram</span>
            </button>

          </div>

        </div>

      </div>

      <!-- Input -->
      <form
        id="md-chat-form"
        class="md-chat-input-area"
      >

        <input
          type="text"
          id="md-chat-input"
          placeholder="Ask Atlas about your business..."
          autocomplete="off"
          maxlength="1000"
          required
        />

        <button
          type="submit"
          id="md-chat-send"
          aria-label="Send message"
        >
          →
        </button>

      </form>

      <!-- Footer -->
      <div class="md-chat-footer">

        <span>
          ✦ Powered by Meridian Dynamics
        </span>

        <button id="md-clear-chat">
          Clear
        </button>

      </div>

    </div>

  `;

  document.body.appendChild(container);


  // =========================================================
  // SELECT ELEMENTS
  // =========================================================

  const toggleBtn = document.getElementById('md-chat-toggle');
  const closeBtn = document.getElementById('md-chat-close');
  const windowEl = document.getElementById('md-chat-window');
  const formEl = document.getElementById('md-chat-form');
  const inputEl = document.getElementById('md-chat-input');
  const historyEl = document.getElementById('md-chat-history');
  const clearBtn = document.getElementById('md-clear-chat');


  // =========================================================
  // BACKEND
  // =========================================================

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const API_ENDPOINT = isLocalhost
    ? 'http://localhost:3000/api/chat'
    : 'https://meridian-atlas-backend.vercel.app/api/chat';


  // =========================================================
  // OPEN / CLOSE ATLAS
  // =========================================================

  toggleBtn.addEventListener('click', () => {
    const isOpen = windowEl.classList.contains('md-chat-open');
    if (isOpen) {
      closeAtlas();
    } else {
      openAtlas();
    }
  });

  function openAtlas() {
    windowEl.classList.add('md-chat-open');

    // GA: Track widget open
    trackEvent('chat_open', {
      event_category: 'Meridian Atlas'
    });

    setTimeout(() => {
      inputEl.focus();
    }, 250);
  }

  function closeAtlas() {
    windowEl.classList.remove('md-chat-open');
  }

  closeBtn.addEventListener('click', closeAtlas);


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = inputEl.value.trim();
    if (!userText) return;

    // GA: Track user typing and submitting message
    trackEvent('chat_message_sent', {
      event_category: 'Meridian Atlas',
      input_type: 'manual_text',
      message_length: userText.length
    });

    // User message
    appendMessage(userText, 'user');

    inputEl.value = '';
    inputEl.disabled = true;

    // Remove welcome screen after first message
    const welcome = historyEl.querySelector('.md-welcome');
    if (welcome) {
      welcome.remove();
    }

    // Typing indicator
    const typing = showTyping();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      typing.remove();

      appendBotMessage(
        data.reply || "Sorry, I couldn't process that. Please try again."
      );

    } catch (err) {
      console.error('Meridian Atlas error:', err);
      typing.remove();

      appendBotMessage(
        `I’m having trouble connecting right now.

Please try again in a moment or contact the Meridian Dynamics team directly.`
      );
    }

    inputEl.disabled = false;
    inputEl.focus();
  });


  // =========================================================
  // APPEND USER MESSAGE
  // =========================================================

  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `md-msg md-msg-${sender}`;
    msg.textContent = text;
    historyEl.appendChild(msg);
    scrollToBottom();
    return msg;
  }


  // =========================================================
  // APPEND BOT MESSAGE
  // =========================================================

  function appendBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'md-msg md-msg-bot';
    wrapper.innerHTML = formatMarkdown(text);
    historyEl.appendChild(wrapper);

    // Message actions
    const actions = document.createElement('div');
    actions.className = 'md-message-actions';
    actions.innerHTML = `
      <button class="md-copy-btn" title="Copy response">⧉</button>
      <button class="md-like-btn" title="Helpful">👍</button>
      <button class="md-dislike-btn" title="Not helpful">👎</button>
    `;

    wrapper.appendChild(actions);

    // Copy
    actions.querySelector('.md-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(text);

      const btn = actions.querySelector('.md-copy-btn');
      btn.textContent = '✓';
      setTimeout(() => {
        btn.textContent = '⧉';
      }, 1500);
    });

    // Like
    actions.querySelector('.md-like-btn').addEventListener('click', () => {
      actions.querySelector('.md-like-btn').textContent = '✓';

      // GA: Track helpful rating
      trackEvent('chat_feedback', {
        event_category: 'Meridian Atlas',
        feedback_type: 'positive'
      });
    });

    // Dislike
    actions.querySelector('.md-dislike-btn').addEventListener('click', () => {
      actions.querySelector('.md-dislike-btn').textContent = '✓';

      // GA: Track negative rating
      trackEvent('chat_feedback', {
        event_category: 'Meridian Atlas',
        feedback_type: 'negative'
      });
    });

    scrollToBottom();
    return wrapper;
  }


  // =========================================================
  // TYPING INDICATOR
  // =========================================================

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'md-typing';
    typing.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    historyEl.appendChild(typing);
    scrollToBottom();
    return typing;
  }


  // =========================================================
  // MARKDOWN FORMATTER
  // =========================================================

  function formatMarkdown(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[\-\*]\s+(.*)$/gim, '• $1')
      .replace(/\n/g, '<br>');
  }


  // =========================================================
  // SCROLL
  // =========================================================

  function scrollToBottom() {
    historyEl.scrollTo({
      top: historyEl.scrollHeight,
      behavior: 'smooth'
    });
  }


  // =========================================================
  // SUGGESTED PROMPTS
  // =========================================================

  function attachSuggestionListeners() {
    document.querySelectorAll('.md-suggestion').forEach(button => {
      button.addEventListener('click', () => {
        const prompt = button.dataset.prompt;

        // GA: Track chip clicked
        trackEvent('chat_suggestion_clicked', {
          event_category: 'Meridian Atlas',
          prompt_text: prompt
        });

        sendSuggestedPrompt(prompt);
      });
    });
  }

  function sendSuggestedPrompt(prompt) {
    const welcome = historyEl.querySelector('.md-welcome');
    if (welcome) {
      welcome.remove();
    }

    appendMessage(prompt, 'user');
    inputEl.disabled = true;

    // GA: Track message sent via prompt
    trackEvent('chat_message_sent', {
      event_category: 'Meridian Atlas',
      input_type: 'suggestion_chip',
      message_length: prompt.length
    });

    const typing = showTyping();

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: prompt
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.json();
      })
      .then(data => {
        typing.remove();
        appendBotMessage(
          data.reply || "Sorry, I couldn't process that."
        );
      })
      .catch(error => {
        console.error('Atlas error:', error);
        typing.remove();
        appendBotMessage(
          'Sorry, something went wrong. Please try again.'
        );
      })
      .finally(() => {
        inputEl.disabled = false;
        inputEl.focus();
      });
  }

  attachSuggestionListeners();


  // =========================================================
  // CLEAR CHAT
  // =========================================================

  clearBtn.addEventListener('click', () => {
    historyEl.innerHTML = `
      <div class="md-welcome">
        <div class="md-welcome-icon">✦</div>
        <h3>How can I help your business?</h3>
        <p>
          I'm Atlas — Meridian Dynamics' AI growth assistant.
          Ask me about websites, SEO, social growth, or your
          digital presence.
        </p>

        <div class="md-suggestions-label">Try asking</div>

        <div class="md-suggestions">
          <button
            class="md-suggestion"
            data-prompt="What website plan would be best for my business?"
          >
            <span>🌐</span>
            <span>I need a website</span>
          </button>

          <button
            class="md-suggestion"
            data-prompt="How can Meridian Dynamics help me grow my business?"
          >
            <span>📈</span>
            <span>Grow my business</span>
          </button>

          <button
            class="md-suggestion"
            data-prompt="How can I improve my Google Business Profile and local SEO?"
          >
            <span>📍</span>
            <span>Improve my Google presence</span>
          </button>

          <button
            class="md-suggestion"
            data-prompt="Which Social Growth plan is right for my business?"
          >
            <span>📱</span>
            <span>Grow my Instagram</span>
          </button>
        </div>
      </div>
    `;

    attachSuggestionListeners();
  });

});