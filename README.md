# clippy
Open Source command line web clipper.

Clippy is a way to save web pages in a clean, readable format.  I find myself with bookmarks of old essays that I refer back to, but more often than not after a year or two, those pages no longer exist.  Reorganized into a new blog, or worse yet, gone forever.  Clippy is my solution to trimming the fat of most modern web pages and saving myself an easy to read copy.

![](clippy.jpg)

Clip articles from the web and save as markdown.  Uses [Mozilla's Readability library](https://github.com/mozilla/readability) to build a simplified article.
## Installation
```
npm install @benprew/clippy
```
## Usage
```
node_modules/.bin/clippy http://norvig.com/sudoku.html > norvig_sudoku.md
```
