#!/usr/bin/env node

'use strict';

const { Readability } = require('@mozilla/readability');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const TurndownService = require('turndown');
const url = require('url');
const turndownPluginGfm = require('turndown-plugin-gfm');
const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService();

turndownService.use(gfm);

let args = {};

process.argv.forEach((arg, index) => {
    switch (arg) {
    case "-h":
        help();
        break;
    case "--help":
        help();
        break;
    case "--html":
        args.format = "html";
        break;
    default:
        args.page = arg;
    }

});

function help() {
    console.error(`clippy <URL> [--html]

Usage:

URL    - the url to be clipped
--html - format output as html (default is markdown)
--help - this help
`)
    process.exit();
}


// TODO: understand why the tables in http://www.lebaneserecipes.com/Tabouleh.htm don't parse correctly in turndown

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

async function main(args) {
  const dom = await JSDOM.fromURL(args.page);
  let imgs = dom.window.document.querySelectorAll("img");
  for (let i=0; i < imgs.length; i++) {
    let imgSrc = imgs[i].getAttribute("src");
    if (imgSrc) {
      imgs[i].setAttribute("src", url.resolve(args.page, imgs[i].getAttribute("src")));
    }
  }

  if (args.format == "html"){
    for (let i=0; i < imgs.length; i++) {
      // replace img src with base64 encoded data block
      let dom_node = imgs[i];
      const imgSrc = dom_node.getAttribute("src");
      dom_node.setAttribute("src", await inlineBase64Img(url.resolve(args.page, imgSrc)));
    }

    // If you're going to use Readability with untrusted input (whether in HTML or DOM
    // form), we strongly recommend you use a sanitizer library like DOMPurify to avoid
    // script injection when you use the output of Readability. We would also recommend
    // using CSP to add further defense-in-depth restrictions to what you allow the
    // resulting content to do. The Firefox integration of reader mode uses both of
    // these techniques itself. Sanitizing unsafe content out of the input is explicitly
    // not something we aim to do as part of Readability itself - there are other good
    // sanitizer libraries out there, use them!
    let article = new Readability(dom.window.document).parse();
    console.log('<body>');
    console.log(`<h3>${article.title}</h3>`);
    console.log(`<p>Excerpt: ${article.exceprt} </p>`);
    console.log(`<p>Length: ${article.length} </p>`);
    console.log(`<p>Byline: ${article.byline} </p>`);
    console.log(article.content);
    console.log('</body>');
  } else {
    let article = new Readability(dom.window.document).parse();
    console.log(`---\ntitle: ${article.title}\nurl: ${args.page}\n\n---\n`);
    console.log(turndownService.turndown(article.content));
  }
}

// Return the image specified by page in base64, so it can inlined
function inlineBase64Img(page)
{
  return new Promise((resolve, reject) => {
    var http;
    if (page.startsWith("https")) {
      http = require('https');
    } else {
      http = require('http');
    }

    var body = [];

    // const req = http.request(new URL(page), , (res) => {
    const req = http.get(new URL(page), (res) => {
      res.setEncoding('binary');
      // console.error(`STATUS: ${res.statusCode}`);
      // console.error(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      res.on('end', () => {
        const imgStr = Buffer.from(body.join(''), 'binary').toString('base64');
        const contentType = res.headers['content-type'];
        resolve(`data:${contentType};base64,${imgStr}`);
      });
      res.on('abort', () => {
        reject("aborted");
      });
    });

    req.on('error', (e) => {
      reject(`problem with request: ${e.message}`);
    });
  });
}

main(args);
