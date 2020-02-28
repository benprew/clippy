#!/usr/bin/env node

'use strict';

const Readability = require("readability");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const TurndownService = require('turndown');
const url = require('url');
const turndownPluginGfm = require('turndown-plugin-gfm');
const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService();

turndownService.use(gfm);

const page = process.argv[2];

// TODO: understand why the tables in http://www.lebaneserecipes.com/Tabouleh.htm don't parse correctly in turndown

// custom PRE tag parser, since turndown only parses <pre><code> blocks
// turndownService.addRule(
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

async function main(page) {
  const dom = await JSDOM.fromURL(page);
  let imgs = dom.window.document.querySelectorAll("img");
  for (let i=0; i < imgs.length; i++) {
    imgs[i].setAttribute("src", url.resolve(page, imgs[i].getAttribute("src")));
  }

  if (process.argv[3] == "--html"){
    for (let i=0; i < imgs.length; i++) {
      // replace img src with base64 encoded data block
      let dom_node = imgs[i];
      const imgSrc = dom_node.getAttribute("src");
      dom_node.setAttribute("src", await inlineBase64Img(url.resolve(page, imgSrc)));
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
    console.log(`---\ntitle: ${article.title}\nurl: ${page}\n\n---\n`);
    //    console.log(turndownService.turndown(article.content));
    let html = `<table><tbody><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td rowspan="3"><div><p>Serves 4</p></div><ul><li>3 cups of finely chopped flat leaf parsley</li><li>1/2 cup of finely chopped mint</li><li>4 or 5 finely chopped spring onions ( with the green parts )</li><li>4 tomatoes medium size chopped into small cubes</li><li>100g of fine burghul</li><li>1/2 cup lemon juice</li><li>4 tbs olive oil</li><li>Salt and Pepper</li></ul></td><td colspan="4"><img src="http://www.lebaneserecipes.com/Assets/tabouleh.jpg" width="312" height="185"></td></tr><tr><td></td><td colspan="3"><div><p><i>** <b>Important</b> **</i></p><p><i>When using fresh vegetables and herbs, make sure they are washed thoroughly and drained.</i></p></div></td></tr><tr><td></td><td></td><td colspan="2"><a href="http://www.lebaneserecipes.com/Lebanese-Recipes.htm" onmouseout="MM_swapImgRestore()" onmouseover="MM_swapImage('Image11','','Assets/b_back_o.gif',1)"><img src="http://www.lebaneserecipes.com/Assets/b_back.gif" width="75" height="43" name="Image11"></a></td></tr><tr><td colspan="4"><p>Soak the burghul in cold water for 1/2 an hour then drain. Mix all the ingredients together, taste and adjust seasoning if needed. Serve with lettuce leaves .</p></td><td></td></tr><tr><td><img width="400" height="1" src="http://www.lebaneserecipes.com/transparent.gif"></td><td><img width="4" height="1" src="http://www.lebaneserecipes.com/transparent.gif"></td><td><img width="233" height="1" src="http://www.lebaneserecipes.com/transparent.gif"></td><td><img width="65" height="1" src="http://www.lebaneserecipes.com/transparent.gif"></td><td><img width="13" height="1" src="http://www.lebaneserecipes.com/transparent.gif"></td></tr></tbody></table>`;
    console.log(turndownService.turndown(html));
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
      // console.log(`STATUS: ${res.statusCode}`);
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
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

main(page);
