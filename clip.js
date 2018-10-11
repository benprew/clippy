#!/usr/bin/env node

'use strict';

const axios = require('axios');
const Readability = require("Readability");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const TurndownService = require('turndown')
const turndownService = new TurndownService()

const url = process.argv[2];

axios(url).then((resp) => {
  const html = resp.data;
  const dom = new JSDOM(html);
  var article = new Readability(dom.window.document).parse();
  console.log(`---\ntitle: ${article.title}\nurl: ${url}\n---\n`);
  console.log(turndownService.turndown(article.content));
});
