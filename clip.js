#!/usr/bin/env node

'use strict';

const Readability = require("readability");
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

function get_url(url)
{
  return new Promise((resolve, reject) => {
  var http;
  if (url.startsWith("https")) {
    http = require('https');
  } else {
    http = require('http');
  }

  var output = "";
  var page = "";

  // const req = http.request(new URL(url), , (res) => {
  const req = http.get(new URL(url), (res) => {
    // console.log(`STATUS: ${res.statusCode}`);
    // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.on('data', (chunk) => {
      page += chunk;
    });
    res.on('end', () => {
      console.log('done');
      const imgStr = Buffer.from(page).toString('base64');
      const contentType = res.headers['content-type'];

      resolve(`data:${contentType};base64${imgStr}`);
    });
    res.on('abort', () => {
      reject(console.log("aborted"));

    });
  });

  req.on('error', (e) => {
    reject(console.error(`problem with request: ${e.message}`));
  });

  });
}

async function main(url) {
  const dom = await JSDOM.fromURL(url);
  var imgs = dom.window.document.querySelectorAll("img");
  for (var i=0; i < imgs.length; i++) {
    // replace img src with base64 encoded data block
    let dom_node = imgs[i];
    const imgSrc = dom_node.getAttribute("src");
    dom_node.setAttribute("src", await get_url("http://www.lebaneserecipes.com/" + imgSrc));
    console.log(imgSrc);
  }
  var article = new Readability(dom.window.document).parse();

  console.log(`---\ntitle: ${article.title}\nurl: ${url}\n---\n`);
  console.log(turndownService.turndown(article.content));
}

main(url);
