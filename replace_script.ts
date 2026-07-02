import fs from "fs";

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/AKfycbzC8Qo2ps-OhRJk5NsHSriEe7nFfShRhSZMKOMYpkfLhzjnoeTCgGo_vQ2X4s8hHHyj/g, 'AKfycbwVjBOpiRYP4Xeqy9PONQJPe-8jlAGWXo48QA2UmvgIAQgANQgnJVHYYt95FROqVqUo2A');
  content = content.replace(/AKfycbyfnMj6QwCgsW9dLbow1rJxHOQvzoyKm4tzSxBd9I1TrAPyLmWfvJx4_C6dL4vbWfmvhA/g, 'AKfycbwVjBOpiRYP4Xeqy9PONQJPe-8jlAGWXo48QA2UmvgIAQgANQgnJVHYYt95FROqVqUo2A');
  fs.writeFileSync(file, content);
}

replaceInFile('server.ts');
replaceInFile('src/services/api.ts');
console.log('done');
