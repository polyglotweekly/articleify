# articleify

A tool for generating static sites from directories full of [Markdown](http://commonmark.org/) articles.

Using the same markdown parser as npm, and the same syntax-highlighter
as Atom, articleify aims to be a great platform for blogging about
code.

See [www.polyglotweekly.com](http://www.polyglotweekly.com) for an example of articleify in action.

## Installing

`npm install articleify -g`

## Usage

### articleify generate

Generate a stubbed markdown file from a template. This process populates [html-frontmatter](https://www.npmjs.com/package/html-frontmatter) compatible
meta-information, which is used when your article is converted to HTML.

`articleify generate --output-directory=./markdown`

### articleify build

Convert a directory of markdown files into HTML. html-frontmatter
meta-information is used to add [schema.org](http://schema.org/Article)
compatible microdata.

`articleify build ./`
