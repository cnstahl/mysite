---
layout: page
title: "Papers"
permalink: /papers/
---

You can also find a list of my papers on <a href="https://arxiv.org/a/stahl_c_1.html" target="_blank">my arXiv page</a> or <a href="https://scholar.google.com/citations?hl=en&user=6CcBuF0AAAAJ" target="_blank">my google scholar page</a>. 

{% assign sorted_papers = site.papers | sort: "arxiv" | reverse %}
<ul>
{% for paper in sorted_papers %}
  <li>
    <strong>{{ paper.title }}</strong><br>
    {{ paper.authors }}<br>
    {% if paper.journal %}<a href="https://doi.org/{{ paper.doi }}" target="_blank"><em>{{ paper.journal }}</em> ({{ paper.year }})</a> <br> {% endif %}
    {% if paper.arxiv %}<a href="https://arxiv.org/abs/{{ paper.arxiv }}" target="_blank">arXiv:{{ paper.arxiv }}</a>{% endif %}
    {% if paper.pdf %} | <a href="{{ paper.pdf | relative_url }}" target="_blank">PDF</a>{% endif %}
  </li>
{% endfor %}
</ul>