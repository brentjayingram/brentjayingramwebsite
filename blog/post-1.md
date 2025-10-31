<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How I Broke, Then Unbroke, Our Cloud — Brent Ingram</title>
  <link rel="stylesheet" href="../assets/style.css" />
</head>
<body>

  <!-- <nav class="site-nav">
    <div class="nav-inner">
      <a class="brand" href="../index.html">
        <span>Brent Ingram</span>
        <span class="brand-role">Cloud Engineer</span>
      </a>
      <div class="menu">
        <a href="../about.html">About Me</a>
        <a href="../resume.html">Resume</a>
        <a class="active" href="../blog-index.html">Blog</a>
      </div>
    </div>
  </nav> -->

  <main>
    <article class="panel">
      <div class="small-dim" style="font-size:.8rem;">2025-10-30</div>
      <h1>How I Broke, Then Unbroke, Our Cloud</h1>
      <p class="small-dim" style="font-size:1rem;">
        This is the story of an outage, a pager, a pot of coffee that could dissolve a spoon, and why
        disaster recovery plans that only live in Confluence are fiction.
      </p>

      <p class="small-dim" style="font-size:1rem;">
        Working theory: most “incidents” are actually “architecture debt coming due.” The specific cause
        matters less than the shape of the blast radius. What failed? How fast did it cascade? How fast
        could you isolate it?
      </p>

      <p class="small-dim" style="font-size:1rem;">
        The fix wasn’t heroic shell work. The fix was that we already had known-good AMIs, Terraform to
        stand them back up, and backups in a different account that couldn’t be wiped. That was the win.
      </p>

      <p class="small-dim" style="font-size:1rem;">
        The lesson: resilience is not “we have backups.” Resilience is “we can rebuild production at 3am
        without asking permission from the environment that just got compromised.”
      </p>
    </article>
  </main>

  <footer>
    <div>© <span id="year"></span> Brent Ingram.</div>
  </footer>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
  </script>
</body>
</html>
