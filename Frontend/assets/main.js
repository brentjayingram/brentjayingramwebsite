// assets/main.js

// --- Existing blogPosts manifest ---
const blogPosts = [

  {
    title: "How I used terraform to create a swa blog with Hugo",
    date: "2023-01-03",
    slug: "tfblog.md",
    excerpt: "Building a static web app blog using Terraform and Hugo after my previous hosting service deprecated my setup."
  },
  {
    title: "How to monitor a server using New Relic",
    date: "2022-12-20",
    slug: "newrelicmonitoring.md",
    excerpt: "Step-by-step guide to installing and configuring New Relic agents for server performance monitoring."
  },
  {
    title: "Why you should start using Infrastructure as Code in your organization",
    date: "2022-11-19",
    slug: "whyiac.md",
    excerpt: "Infrastructure as code treats infrastructure components as code, enabling version control, reusability, and automated management."
  },
  {
    title: "What are the differences between Azure DevOps and GitHub ?",
    date: "2022-07-20",
    slug: "devopsvsgithub.md",
    excerpt: "Comparing Azure DevOps and GitHub for code repositories, automation, and deployment processes."
  },
  {
    title: "What is CI/CD ?",
    date: "2022-06-20",
    slug: "whatiscicd.md",
    excerpt: "Continuous Integration and Continuous Delivery practices that minimize time between writing code and deploying to production."
  },
  {
    title: "What is Docker",
    date: "2021-12-20",
    slug: "whatisdocker.md",
    excerpt: "Docker makes it easier to create, deploy, and run applications using lightweight, portable containers."
  },
  {
    title: "My Experience with the 2021 NASA Space Apps Hackathon",
    date: "2021-10-24",
    slug: "nasahackathon.md",
    excerpt: "Building a React Leaflet map application to detect plastic marine debris using AI/ML - came in 2nd place!"
  },
  {
    title: "What is big O notation",
    date: "2021-04-20",
    slug: "bigo.md",
    excerpt: "A beginner's explanation of Big O Notation - measuring how well algorithms perform with different input sizes."
  },
  {
    title: "What is Merge Sort",
    date: "2021-03-26",
    slug: "mergesort.md",
    excerpt: "Understanding the divide and conquer algorithm that efficiently sorts arrays with O(n log n) complexity."
  },
  {
    title: "My Path to Becoming a Web Developer",
    date: "2020-09-01",
    slug: "mypath.md",
    excerpt: "The longer-than-expected journey from IT support to web development, dealing with imposter syndrome along the way."
  },
  {
    title: "How I created my first React Native iOS/Android App",
    date: "2019-03-10",
    slug: "reactapp.md",
    excerpt: "Creating a mobile app for a local youth group using React Native, Expo, and Firebase with a 4-month deadline."
  }
];

// --- Blog list loader (unchanged except link target) ---
function loadBlogList() {
  const container = document.getElementById("blog-list");
  if (!container) return;

  blogPosts.forEach(post => {
    const card = document.createElement("a");
    card.className = "blog-card";

    // We'll send ?post=post-1.md to a shared post.html viewer
    card.href = `blog/post.html?post=${encodeURIComponent(post.slug)}`;

    card.innerHTML = `
      <h3>${post.title}</h3>
      <div class="date">${post.date}</div>
      <p>${post.excerpt}</p>
    `;

    container.appendChild(card);
  });
}

// --- Minimal Markdown → HTML converter ---
// This is intentionally small. It's not CommonMark-perfect.
// It handles:
//  - Headings starting with #, ##, ###
//  - Bulleted lists starting with "-" or "*"
//  - Code blocks fenced with ```
//  - Bold **text** and italic *text*
//  - Paragraphs for everything else
function renderMarkdown(mdText) {
  // Strip frontmatter if present
  let content = mdText.replace(/\r\n/g, "\n");
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      content = content.substring(endIndex + 5);
    }
  }
  
  // If content looks like HTML, extract just the article content
  if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const article = doc.querySelector('article');
    if (article) {
      // Remove the date and title elements to avoid duplication
      const dateEl = article.querySelector('.small-dim');
      const titleEl = article.querySelector('h1');
      if (dateEl) dateEl.remove();
      if (titleEl) titleEl.remove();
      return article.innerHTML;
    }
    return content;
  }
  
  const lines = content.split("\n");

  let html = "";
  let inCodeBlock = false;
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length > 0) {
      html += "<ul class=\"bullets\">";
      listBuffer.forEach(item => {
        html += `<li>${inlineFormat(item)}</li>`;
      });
      html += "</ul>";
      listBuffer = [];
    }
  }

  function inlineFormat(text) {
    // bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // italic *text*
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // inline code `code`
    text = text.replace(/`([^`]+?)`/g, "<code>$1</code>");
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code fence ``` toggles code block mode
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        html += `<pre class="panel" style="background-color:#0f172a; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:.75rem; font-size:.8rem; overflow-x:auto;"><code>`;
      } else {
        inCodeBlock = false;
        html += `</code></pre>`;
      }
      continue;
    }

    if (inCodeBlock) {
      // escape HTML inside code
      html += line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        + "\n";
      continue;
    }

    // Heading?
    if (line.startsWith("### ")) {
        flushList();
        html += `<h3>${inlineFormat(line.replace(/^###\s+/, ""))}</h3>`;
        continue;
    }
    if (line.startsWith("## ")) {
        flushList();
        html += `<h2>${inlineFormat(line.replace(/^##\s+/, ""))}</h2>`;
        continue;
    }
    if (line.startsWith("# ")) {
        flushList();
        html += `<h1>${inlineFormat(line.replace(/^#\s+/, ""))}</h1>`;
        continue;
    }

    // List item?
    if (line.match(/^\s*[-*]\s+/)) {
      const item = line.replace(/^\s*[-*]\s+/, "");
      listBuffer.push(item);
      continue;
    } else {
      // if we were building a list and hit a non-list line, close it
      flushList();
    }

    // Blank line -> spacing
    if (line.trim() === "") {
      html += "<br/>";
      continue;
    }

    // Normal paragraph text
    html += `<p class="small-dim" style="font-size:1rem;">${inlineFormat(line)}</p>`;
  }

  // Flush any trailing list
  flushList();

  // If code block never closed, close it to avoid broken DOM
  if (inCodeBlock) {
    html += `</code></pre>`;
  }

  return html;
}

// --- Single post loader ---
// On blog/post.html we read ?post=post-1.md and inject rendered HTML.
async function loadSinglePost() {
  const articleEl = document.getElementById("post-body");
  const headerTitleEl = document.getElementById("post-title");
  const headerDateEl = document.getElementById("post-date");

  if (!articleEl || !headerTitleEl || !headerDateEl) return;

  // Parse query string
  const params = new URLSearchParams(window.location.search);
  const postFile = params.get("post");

  // Find metadata from blogPosts by slug
  const meta = blogPosts.find(p => p.slug === postFile);

  if (meta) {
    headerTitleEl.textContent = meta.title;
    headerDateEl.textContent = meta.date;
  } else {
    headerTitleEl.textContent = "Post";
    headerDateEl.textContent = "";
  }

  try {
    const res = await fetch(postFile);
    const md = await res.text();
    const rendered = renderMarkdown(md);
    articleEl.innerHTML = rendered;
  } catch (err) {
    articleEl.innerHTML = "<p>Unable to load this post.</p>";
  }
}

// Run on DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadBlogList();
  loadSinglePost();
});
// Track visitor on page load
fetch('https://k97k1rma83.execute-api.us-east-1.amazonaws.com/dev/track-visitor', {
    method: 'POST'
}).catch(() => {}); // Silent fail

