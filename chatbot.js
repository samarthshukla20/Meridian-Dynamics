document.addEventListener('DOMContentLoaded', () => {

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

  const toggleBtn =
    document.getElementById('md-chat-toggle');

  const closeBtn =
    document.getElementById('md-chat-close');

  const windowEl =
    document.getElementById('md-chat-window');

  const formEl =
    document.getElementById('md-chat-form');

  const inputEl =
    document.getElementById('md-chat-input');

  const historyEl =
    document.getElementById('md-chat-history');

  const clearBtn =
    document.getElementById('md-clear-chat');


  // =========================================================
  // BACKEND
  // =========================================================

  // Change this to your deployed backend URL in production
  const API_ENDPOINT =
    'http://localhost:3000/api/chat';


  // =========================================================
  // OPEN ATLAS
  // =========================================================

  toggleBtn.addEventListener('click', () => {

    const isOpen =
      windowEl.classList.contains('md-chat-open');


    if (isOpen) {

      closeAtlas();

    } else {

      openAtlas();

    }

  });


  function openAtlas() {

    windowEl.classList.add('md-chat-open');

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


    const userText =
      inputEl.value.trim();


    if (!userText) return;


    // User message
    appendMessage(
      userText,
      'user'
    );


    inputEl.value = '';

    inputEl.disabled = true;


    // Remove welcome screen after first message
    const welcome =
      historyEl.querySelector('.md-welcome');

    if (welcome) {
      welcome.remove();
    }


    // Typing indicator
    const typing =
      showTyping();


    try {

      const response =
        await fetch(API_ENDPOINT, {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            message: userText
          })

        });


      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        );
      }


      const data =
        await response.json();


      typing.remove();


      appendBotMessage(
        data.reply ||
        "Sorry, I couldn't process that. Please try again."
      );


    } catch (err) {

      console.error(
        'Meridian Atlas error:',
        err
      );


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

    const msg =
      document.createElement('div');


    msg.className =
      `md-msg md-msg-${sender}`;


    msg.textContent = text;


    historyEl.appendChild(msg);


    scrollToBottom();


    return msg;

  }


  // =========================================================
  // APPEND BOT MESSAGE
  // =========================================================

  function appendBotMessage(text) {

    const wrapper =
      document.createElement('div');


    wrapper.className =
      'md-msg md-msg-bot';


    wrapper.innerHTML =
      formatMarkdown(text);


    historyEl.appendChild(wrapper);


    // Message actions
    const actions =
      document.createElement('div');


    actions.className =
      'md-message-actions';


    actions.innerHTML = `

      <button
        class="md-copy-btn"
        title="Copy response"
      >
        ⧉
      </button>

      <button
        class="md-like-btn"
        title="Helpful"
      >
        👍
      </button>

      <button
        class="md-dislike-btn"
        title="Not helpful"
      >
        👎
      </button>

    `;


    wrapper.appendChild(actions);


    // Copy
    actions
      .querySelector('.md-copy-btn')
      .addEventListener('click', () => {

        navigator.clipboard.writeText(text);

        const btn =
          actions.querySelector('.md-copy-btn');


        btn.textContent = '✓';


        setTimeout(() => {
          btn.textContent = '⧉';
        }, 1500);

      });


    // Like
    actions
      .querySelector('.md-like-btn')
      .addEventListener('click', () => {

        actions.querySelector(
          '.md-like-btn'
        ).textContent = '✓';

      });


    // Dislike
    actions
      .querySelector('.md-dislike-btn')
      .addEventListener('click', () => {

        actions.querySelector(
          '.md-dislike-btn'
        ).textContent = '✓';

      });


    scrollToBottom();


    return wrapper;

  }


  // =========================================================
  // TYPING INDICATOR
  // =========================================================

  function showTyping() {

    const typing =
      document.createElement('div');


    typing.className =
      'md-typing';


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

      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Bold
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      )

      // Bullet points
      .replace(
        /^[\-\*]\s+(.*)$/gim,
        '• $1'
      )

      // Line breaks
      .replace(
        /\n/g,
        '<br>'
      );

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

    document
      .querySelectorAll('.md-suggestion')
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const prompt =
              button.dataset.prompt;


            sendSuggestedPrompt(prompt);

          }
        );

      });

  }


  function sendSuggestedPrompt(prompt) {

    const welcome =
      historyEl.querySelector('.md-welcome');


    if (welcome) {
      welcome.remove();
    }


    appendMessage(
      prompt,
      'user'
    );


    inputEl.disabled = true;


    const typing =
      showTyping();


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
          data.reply ||
          "Sorry, I couldn't process that."
        );

      })

      .catch(error => {

        console.error(
          'Atlas error:',
          error
        );

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
  // MERIDIAN BUSINESS TOOLS
  // =========================================================

  document
    .querySelectorAll('.md-tool-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const tool =
            button.dataset.tool;


          if (tool === 'competitor') {

            appendBotMessage(`
**Competitor Finder**

Discover the businesses competing for your customers.

We'll analyze:

• Local competitors
• Google ratings
• Review counts
• Websites
• Social presence
• Local SEO

**Coming soon to Meridian Business Tools.**
            `);

          }


          if (tool === 'presence') {

            appendBotMessage(`
**Digital Presence Score**

Get a complete overview of your business's online presence.

We'll analyze:

• Website
• Google Business Profile
• SEO
• Reviews
• Social media

and generate a **Digital Presence Score out of 100.**

**Coming soon to Meridian Business Tools.**
            `);

          }


          if (tool === 'website') {

            appendBotMessage(`
**Website Health Check**

We'll analyze your website for:

• Performance
• SEO
• Mobile experience
• User experience
• Technical issues

**Coming soon to Meridian Business Tools.**
            `);

          }

        }
      );

    });


  // =========================================================
  // CLEAR CHAT
  // =========================================================

  clearBtn.addEventListener('click', () => {

    historyEl.innerHTML = `

      <div class="md-welcome">

        <div class="md-welcome-icon">
          ✦
        </div>

        <h3>
          How can I help your business?
        </h3>

        <p>
          I'm Atlas — Meridian Dynamics' AI growth assistant.
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

    `;


    attachSuggestionListeners();


  });

});