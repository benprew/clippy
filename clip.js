#!/usr/bin/env node

'use strict';

const Readability = require("Readability");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const TurndownService = require('turndown');

const turndownService = new TurndownService();

const url = process.argv[2];

// keep table elements, since that's how commonmark renders tables
turndownService.keep(['table', 'td', 'tr', 'tbody', 'thead']);
// custom PRE tag parser, since turndown only parses <pre><code> blocks
turndownService.addRule(
  'indented-pre-block',
  {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'indented' &&
          node.nodeName === 'PRE'
      );
    },

    replacement: function (content, node, options) {
      return (
        '\n\n    ' +
          node.firstChild.textContent.replace(/\n/g, '\n    ') +
          '\n\n'
      );
    }
  }
);

JSDOM.fromURL(url).then(dom => {
  var article = new Readability(dom.window.document).parse();

  console.log(`---\ntitle: ${article.title}\nurl: ${url}\n---\n`);
  console.log(turndownService.turndown(article.content));
});
